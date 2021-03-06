/*globals define, WebGMEGlobal*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Sat Apr 24 2021 14:27:13 GMT-0400 (Eastern Daylight Time).
 */

define([
    'jointjs',
    'lodash',
    'geometry',
    'css!jointjs.css',
    'css!./styles/SimPetriNetFiringWidget.css',
    'pendes/firing-sim-defs',
], function (joint, _, g) {
    'use strict';

    var WIDGET_CLASS = 'sim-petri-net-firing';

    function SimPetriNetFiringWidget(logger, container) {
        this._logger = logger.fork('Widget');

        this._el = container;

        this.nodes = {};
        this._initialize();

        this._logger.debug('ctor finished');
    }

    SimPetriNetFiringWidget.prototype._initialize = function () {
        var width = this._el.width(),
            height = this._el.height(),
            self = this;

        // set widget class
        this._el.addClass(WIDGET_CLASS);

        this._graph = new joint.dia.Graph();
        this._adjustVertices = _.partial(this._adjustVertices, this._graph);
        this._graph.on('add remove change:source change:target', this._adjustVertices);
        this._paper = new joint.dia.Paper({
            el: this._el,
            width,
            height,
            gridSize: 10,
            defaultAnchor: { name: 'perpendicular' },
            defaultConnectionPoint: { name: 'boundary' },
            model: this._graph,
            interactive: false,
        });

        this._paper.on('element:pointerdblclick', function (cellView) {
            const jointId = cellView.model.id;
            const modelId = self._petriNet.joint2modelIds.get(jointId);
            const isTransition = self._petriNet.transitions.has(modelId);
            const jointCell = self._graph.getCell(jointId);
            if (isTransition && self._canFire(self._graph.getCell(jointId))) {
                self.fireTransition(jointCell, modelId);
                setTimeout(() => {
                    self._decorate();
                }, 550);
            }
        });

        this._petriNet = null;
    };

    SimPetriNetFiringWidget.prototype.initPetriNet = function (petriNet) {
        this._petriNet = petriNet;
        this._graph.clear();

        const { places, transitions, flows } = this._petriNet;
        this.dupFlows = [];

        const placeVertices = this._buildPlaceVertices(places);
        const transitionVertices = this._buildTransitionVertices(transitions);
        this._petriNet.model2jointIds = this._buildModel2JointMap([...placeVertices, ...transitionVertices]);
        this._petriNet.joint2modelIds = this._buildJoint2ModelMap([...placeVertices, ...transitionVertices]);
        const flowVertices = this._buildFlows(flows);

        this._graph.addCell([
            ...placeVertices.map(({ vertex }) => vertex),
            ...transitionVertices.map(({ vertex }) => vertex),
        ]);
        this._graph.addCell(flowVertices);
        this._decorate();
    };

    SimPetriNetFiringWidget.prototype._buildPlaceVertices = function (places) {
        return Array.from(places.entries()).map(([id, { name, position, tokens }]) => ({
            id,
            vertex: new joint.shapes.pn.Place({
                position,
                attrs: {
                    '.label': {
                        text: name,
                        y: 85,
                    },
                    '.root': {
                        stroke: '#000',
                        style: {
                            cursor: 'default',
                        },
                        'stroke-width': 3,
                    },
                    '.tokens > circle': {
                        style: {
                            cursor: 'default',
                        },
                    },
                },
                tokens,
            }),
        }));
    };

    SimPetriNetFiringWidget.prototype._buildTransitionVertices = function (transitions) {
        return Array.from(transitions.entries()).map(([id, { name, position }]) => ({
            id,
            vertex: new joint.shapes.pn.Transition({
                position,
                attrs: {
                    '.label': {
                        text: name,
                        y: 85,
                    },
                    '.root': {
                        stroke: '#9586fd',
                        style: {
                            cursor: 'pointer',
                        },
                    },
                },
            }),
        }));
    };

    SimPetriNetFiringWidget.prototype._buildModel2JointMap = function (nodeVertices) {
        return nodeVertices.reduce((accum, { id, vertex }) => accum.set(id, vertex.id), new Map());
    };

    SimPetriNetFiringWidget.prototype._buildJoint2ModelMap = function (nodeVertices) {
        return nodeVertices.reduce((accum, { id, vertex }) => accum.set(vertex.id, id), new Map());
    };

    SimPetriNetFiringWidget.prototype._buildFlows = function (flows) {
        return flows.map(({ weight, srcId, dstId, isInputFlow }) => {
            return new joint.shapes.standard.Link({
                source: { id: this._petriNet.model2jointIds.get(srcId), selector: '.root' },
                target: { id: this._petriNet.model2jointIds.get(dstId), selector: '.root' },
                attrs: {
                    wrapper: {
                        cursor: 'default',
                    },
                },
            }).appendLabel({
                attrs: {
                    text: {
                        text: weight,
                    },
                },
            });
        });
    };

    SimPetriNetFiringWidget.prototype.fireTransition = function (transition, transitionModelId) {
        const self = this;
        const inLinks = this._graph.getConnectedLinks(transition, { inbound: true });
        const inPlaces = inLinks.map((link) => link.getSourceElement());
        const outLinks = this._graph.getConnectedLinks(transition, { outbound: true });
        const outPlaces = outLinks.map((link) => link.getTargetElement());

        inPlaces.forEach((place) => {
            const weight = this._petriNet.weights
                .get(this._petriNet.joint2modelIds.get(place.id))
                .get(transitionModelId);
            setTimeout(() => place.set('tokens', place.get('tokens') - weight), 0);

            const links = inLinks.filter((link) => link.getSourceElement() === place);
            links.forEach((link) => {
                const token = joint.V('circle', { r: 5 });
                link.findView(self._paper).sendToken(token, 500);
            });
        });

        outPlaces.forEach((place) => {
            const links = outLinks.filter((link) => link.getTargetElement() === place);
            links.forEach((link) => {
                const weight = this._petriNet.weights
                    .get(transitionModelId)
                    .get(this._petriNet.joint2modelIds.get(place.id));
                const token = joint.V('circle', { r: 5 });
                link.findView(self._paper).sendToken(token, 500);
                link.findView(self._paper).sendToken(token, 500, () =>
                    place.set('tokens', place.get('tokens') + weight)
                );
            });
        });
    };

    SimPetriNetFiringWidget.prototype._decorate = function () {
        const transitions = Array.from(this._petriNet.transitions.keys())
            .map((key) => this._petriNet.model2jointIds.get(key))
            .map((id) => this._graph.getCell(id));
        transitions.forEach((t) => {
            if (this._canFire(t)) {
                t.attr('.root/style', { cursor: 'pointer' }).attr('.root/fill', '#000');
            } else {
                t.attr('.root/style', { cursor: 'default' }).attr('.root/fill', '#777');
            }
        });
    };

    SimPetriNetFiringWidget.prototype._canFire = function (transition) {
        return this._graph
            .getConnectedLinks(transition, { inbound: true })
            .map((link) => ({ inId: link.getSourceElement().id, outId: link.getTargetElement().id }))
            .map(({ inId, outId }) => ({
                inId: this._petriNet.joint2modelIds.get(inId),
                outId: this._petriNet.joint2modelIds.get(outId),
                srcTokens: this._graph.getCell(inId).get('tokens'),
            }))
            .map(({ inId, outId, srcTokens }) => ({
                srcTokens,
                weight: this._petriNet.weights.get(inId).get(outId),
            }))
            .every(({ srcTokens, weight }) => weight <= srcTokens);
    };

    SimPetriNetFiringWidget.prototype._adjustVertices = function (graph, cell) {
        // if `cell` is a view, find its model
        cell = cell.model || cell;

        if (cell instanceof joint.dia.Element) {
            // `cell` is an element

            _.chain(graph.getConnectedLinks(cell))
                .groupBy(function (link) {
                    // the key of the group is the model id of the link's source or target
                    // cell id is omitted
                    return _.omit([link.source().id, link.target().id], cell.id)[0];
                })
                .each(function (group, key) {
                    // if the member of the group has both source and target model
                    // then adjust vertices
                    if (key !== 'undefined') adjustVertices(graph, _.first(group));
                })
                .value();

            return;
        }

        // `cell` is a link
        // get its source and target model IDs
        var sourceId = cell.get('source').id || cell.previous('source').id;
        var targetId = cell.get('target').id || cell.previous('target').id;

        // if one of the ends is not a model
        // (if the link is pinned to paper at a point)
        // the link is interpreted as having no siblings
        if (!sourceId || !targetId) return;

        // identify link siblings
        var siblings = _.filter(graph.getLinks(), function (sibling) {
            var siblingSourceId = sibling.source().id;
            var siblingTargetId = sibling.target().id;

            // if source and target are the same
            // or if source and target are reversed
            return (
                (siblingSourceId === sourceId && siblingTargetId === targetId) ||
                (siblingSourceId === targetId && siblingTargetId === sourceId)
            );
        });

        var numSiblings = siblings.length;
        switch (numSiblings) {
            case 0: {
                // the link has no siblings
                break;
            }
            case 1: {
                // there is only one link
                // no vertices needed
                cell.unset('vertices');
                break;
            }
            default: {
                // there are multiple siblings
                // we need to create vertices

                // find the middle point of the link
                var sourceCenter = graph.getCell(sourceId).getBBox().center();
                var targetCenter = graph.getCell(targetId).getBBox().center();
                var midPoint = g.Line(sourceCenter, targetCenter).midpoint();

                // find the angle of the link
                var theta = sourceCenter.theta(targetCenter);

                // constant
                // the maximum distance between two sibling links
                var GAP = 20;

                _.each(siblings, function (sibling, index) {
                    // we want offset values to be calculated as 0, 20, 20, 40, 40, 60, 60 ...
                    var offset = GAP * Math.ceil(index / 2);

                    // place the vertices at points which are `offset` pixels perpendicularly away
                    // from the first link
                    //
                    // as index goes up, alternate left and right
                    //
                    //  ^  odd indices
                    //  |
                    //  |---->  index 0 sibling - centerline (between source and target centers)
                    //  |
                    //  v  even indices
                    var sign = index % 2 ? 1 : -1;

                    // to assure symmetry, if there is an even number of siblings
                    // shift all vertices leftward perpendicularly away from the centerline
                    if (numSiblings % 2 === 0) {
                        offset -= (GAP / 2) * sign;
                    }

                    // make reverse links count the same as non-reverse
                    var reverse = theta < 180 ? 1 : -1;

                    // we found the vertex
                    var angle = g.toRad(theta + sign * reverse * 90);
                    var vertex = g.Point.fromPolar(offset, angle, midPoint);

                    // replace vertices array with `vertex`
                    sibling.vertices([vertex]);
                });
            }
        }
    };

    SimPetriNetFiringWidget.prototype.onWidgetContainerResize = function (width, height) {
        this._logger.debug('Widget is resizing...');
    };

    // Adding/Removing/Updating items
    SimPetriNetFiringWidget.prototype.addNode = function (desc) {
        console.log('adding', desc);
    };

    SimPetriNetFiringWidget.prototype.removeNode = function (gmeId) {
        console.log('removing', gmeId);
    };

    SimPetriNetFiringWidget.prototype.updateNode = function (desc) {
        console.log('updating', desc);
    };

    /* * * * * * * * Visualizer event handlers * * * * * * * */

    SimPetriNetFiringWidget.prototype.onNodeClick = function () {};

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    SimPetriNetFiringWidget.prototype.destroy = function () {};

    SimPetriNetFiringWidget.prototype.onActivate = function () {
        this._logger.debug('SimPetriNetFiringWidget has been activated');
    };

    SimPetriNetFiringWidget.prototype.onDeactivate = function () {
        this._logger.debug('SimPetriNetFiringWidget has been deactivated');
    };

    return SimPetriNetFiringWidget;
});
