const noop = x => x;

export const CodeState = {
	COMPILED: 0,
	OPTIMIZABLE: 1,
	OPTIMIZED: 2,
	STATIC_COMPILED: 3
};
export const CodeStateLookup = {
	'': CodeState.COMPILED,
	'~': CodeState.OPTIMIZABLE,
	'*': CodeState.OPTIMIZED,
	'cpp': CodeState.STATIC_COMPILED
};
export const CodeStateLookupReverse = {
	[CodeState.COMPILED]: '',
	[CodeState.OPTIMIZABLE]: '~',
	[CodeState.OPTIMIZED]: '*',
	[CodeState.STATIC_COMPILED]: 'cpp'
};

export const VmStatesLookup = {
	0: 'JS',
	1: 'GC',
	2: 'COMPILER',
	3: 'OTHER',
	4: 'EXTERNAL',
	5: 'IDLE'
};
export const VmStatesLookupReverse = {
	[VmStatesLookup.JS]: 0,
	[VmStatesLookup.GC]: 1,
	[VmStatesLookup.COMPILER]: 2,
	[VmStatesLookup.OTHER]: 3,
	[VmStatesLookup.EXTERNAL]: 4,
	[VmStatesLookup.IDLE]: 5,
};

let codeFunctionCount = 0;
function CodeFunction(type, name, addr, size, state, funcAddr) {
	this.id = codeFunctionCount++;
	this.type = type;
	this.name = name;
	this.startAddr = addr;
	this.size = size;
	this.state = state;
	this.funcAddr = funcAddr;
	this.executions = 0;
	this.parentPaths = [];
	this.childPaths = [];
}
CodeFunction.prototype.getCallPath = function getCallPath(callee) {
	for (let i = 0; i < this.childPaths.length; i++) {
		const callPath = this.childPaths[i];
		if (callPath.child === callee) {
			return callPath;
		}
	}

	// no existing call path, create a new one
	const callPath = new CallPath(this, callee);
	this.childPaths.push(callPath); // set this -> callee
	callee.parentPaths.push(callPath); // set callee -> this


	return callPath;
};
CodeFunction.prototype.addCallPath = function addCallPath(callee) {
	// this CodeFunction has called the callee
	this.getCallPath(callee).traversals++;
};

function CallPath(parent, child) {
	this.parent = parent;
	this.child = child;
	this.traversals = 0;
}

function findFunctionByAddress(logState, address) {
	return logState.get('functionsByStartAddr').getWithin(address);
}

export function getCallPathIdFromFunctionStack(functionStack) {
	return functionStack.map(func => func.id).join(':');
}

function addCallPathExecution(logState, functionStack) {
	if (functionStack.length === 0) return;
	const callPathId = getCallPathIdFromFunctionStack(functionStack);
	let callPathExecutions = logState.get('callPathExecutions');
	callPathExecutions[callPathId] = callPathExecutions[callPathId] || 0;
	callPathExecutions[callPathId]++;
}

function addCallPathTraversal(logState, functionStack) {
	if (functionStack.length === 0) return;
	let callPathTraversals = logState.get('callPathTraversals');
	let partialStack = [];
	for (let i = 0; i < functionStack.length; i++) {
		partialStack.push(functionStack[i]);
		const callPathId = getCallPathIdFromFunctionStack(partialStack);
		callPathTraversals[callPathId] = callPathTraversals[callPathId] || 0;
		callPathTraversals[callPathId]++;
	}
}

const lineProcessors = {
	// cpp entries
	'shared-library': (logState, [name, startAddr, endAddr]) => {
		startAddr = parseInt(startAddr);
		endAddr = parseInt(endAddr);

		const codeFunction = new CodeFunction('shared', name, startAddr, endAddr - startAddr, CodeState.STATIC_COMPILED);
		logState = logState.update('functionsByStartAddr', functionsByStartAddr => {
			return functionsByStartAddr.insert(codeFunction.startAddr, codeFunction.size, codeFunction);
		});

		return logState;
	},

	// JIT-code
	'code-creation': (logState, [type, kind, start, size, name, funcAddr = null, state = null]) => {
		kind = parseInt(kind);
		start = parseInt(start);
		size = parseInt(size);
		name = name.trim();

		let codeFunction;
		if (funcAddr != null && state != null) {
			funcAddr = parseInt(funcAddr);
			state = CodeStateLookup[state];

			codeFunction = new CodeFunction(type, name, start, size, state, funcAddr);
		} else {
			codeFunction = new CodeFunction(type, name, start, size, CodeState.COMPILED);
		}

		logState = logState.update('functionsByStartAddr', functionsByStartAddr => {
			return functionsByStartAddr.insert(codeFunction.startAddr, codeFunction.size, codeFunction);
		});
		if (funcAddr) {
			logState.get('functionsByFuncAddr')[funcAddr] = logState.get('functionsByFuncAddr')[funcAddr] || [];
			logState.get('functionsByFuncAddr')[funcAddr].push(codeFunction);
		}

		return logState;
	},

	// code was moved
	'code-move': (logState, [from, to]) => {
		from = parseInt(from);
		to = parseInt(to);

		return logState.update(
			'functionsByStartAddr',
			functionsByStartAddr => {
				const func = functionsByStartAddr.get(from);

				if (func == null) {
					console.error(`Was told to move non-existant code from ${from} to ${to}`);
				}

				func.startAddr = to;
				return functionsByStartAddr.remove(from).insert(to, func.size, func);
			}
		);
	},

	// code was deleted
	'code-delete': (logeState, [from]) => {
		from = parseInt(from);

		return logState.update(
			'functionsByStartAddr',
			functionsByStartAddr => {
				const func = functionsByStartAddr.get(from);

				if (func == null) {
					console.error(`Was told to delete non-existant code from ${from}`);
				}

				return functionsByStartAddr.remove(from);
			}
		);
	},

	// a function was moved
	'sfi-move': (logState, [from, to]) => {
		from = parseInt(from);
		to = parseInt(to);

		return logState.update(
			'functionsByFuncAddr',
			functionsByFuncAddr => {
				const funcs = functionsByFuncAddr[from];

				if (funcs == null) {
					return functionsByFuncAddr;
				}

				for (let i = 0; i < funcs.length; i++) {
					funcs[i].funcAddr = to;
				}
				
				delete functionsByFuncAddr[from];
				functionsByFuncAddr[to] = funcs;
				return functionsByFuncAddr;
			}
		);
	},

	'tick': (logState, [programCounter, ns_since_start, is_external_callback, tos_or_external_callback, vmState, ...stack]) => {
		programCounter = parseInt(programCounter);
		ns_since_start = parseInt(ns_since_start);
		is_external_callback = parseInt(is_external_callback);
		tos_or_external_callback = parseInt(tos_or_external_callback);
		vmState = parseInt(vmState);

		if (is_external_callback) {
			// Don't use programCounter when in external callback code, as it can point inside callback's code, and we will erroneously report
			// that a callback calls itself. Instead we use tos_or_external_callback, as simply resetting PC will produce unaccounted ticks.
			programCounter = tos_or_external_callback;
			tos_or_external_callback = 0;
		}

		if (tos_or_external_callback) {
			stack = [programCounter, tos_or_external_callback, ...stack];
		} else {
			stack = [programCounter, ...stack];
		}

		stack = stack
			.map(frame => findFunctionByAddress(logState, frame))
			.filter(func => !!func);
		if (stack[0] != null) {
			stack[0].executions++;
		}

		const inOrderStack = [...stack].reverse();
		addCallPathExecution(logState, inOrderStack);
		addCallPathTraversal(logState, inOrderStack);
		for (let i = 0; i < stack.length - 1; i++) {
			const current = stack[i];
			const caller = stack[i+1];

			caller.addCallPath(current);
		}

		return logState.update('totalTicks', totalTicks => totalTicks + 1);
	},

	'snapshot-pos': noop, // snapshot log (addr, pos)
	'heap-sample-begin': noop, // start of heap sample (space, state, ticks)
	'heap-sample-end': noop, // end of heap sample (space, state)
	'timer-event-start': noop, // start of timer event
	'timer-event-end': noop, // end of timer event

	'profiler': noop,
	'function-creation': noop,
	'function-move': noop,
	'function-delete': noop,
	'heap-sample-item': noop,
};

export function processLogLine(logState, [command, ...values]) {
	if (lineProcessors.hasOwnProperty(command)) {
		logState = lineProcessors[command](logState, values);
		if (logState == null) debugger;
	} else {
		// console.log(values); // squawk about a line we didn't understand
	}

	return logState;
}