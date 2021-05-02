class Node {
    constructor(name, position) {
        this.name = name;
        this.position = position;
        this.flows = [];
    }
}

class Place extends Node {
    constructor(name, position, tokens) {
        super(name, position);
        this.tokens = tokens;
        this.inTransitions = [];
        this.outTransitions = [];
    }

    addInTransition(id) {
        this.inTransitions.push(id);
    }

    addOutTransition(id) {
        this.outTransitions.push(id);
    }
}

class Transition extends Node {
    constructor(name, position) {
        super(name, position);
        this.inPlaces = [];
        this.outPlaces = [];
    }

    addInPlace(id) {
        this.inPlaces.push(id);
    }

    addOutPlace(id) {
        this.outPlaces.push(id);
    }
}

class Flow {
    constructor(weight, srcId, dstId, isInputFlow) {
        this.weight = weight;
        this.srcId = srcId;
        this.dstId = dstId;
        this.isInputFlow = isInputFlow;
    }
}
