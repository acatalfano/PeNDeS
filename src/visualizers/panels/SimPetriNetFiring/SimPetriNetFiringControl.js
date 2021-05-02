/*globals define, WebGMEGlobal*/
/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Sat Apr 24 2021 14:27:13 GMT-0400 (Eastern Daylight Time).
 */

//TODO: remember to make the seed!!!!
//TODO: if something weird with the plugins or seeds, make sure this is in your config.webgme.js:
//          config.plugin.basePaths.push(__dirname + '/../src/plugins');
//          config.seedProjects.basePaths.push(__dirname + '/../src/seeds/<<<seedName>>>');

define(['js/Constants', 'js/Utils/GMEConcepts', 'js/NodePropertyNames', 'pendes/firing-sim-defs'], function (
    CONSTANTS,
    GMEConcepts,
    nodePropertyNames
) {
    'use strict';

    function SimPetriNetFiringControl(options) {
        //const self = this;

        this._logger = options.logger.fork('Control');

        this._client = options.client;

        // Initialize core collections and variables
        this._widget = options.widget;

        this._currentNodeId = null;
        this._currentNodeParentId = undefined;

        this._initWidgetEventHandlers();
        //this.setFireableTransitions = this.setFireableTransitions.bind(this);
    }

    SimPetriNetFiringControl.prototype._initWidgetEventHandlers = function () {
        this._widget.onNodeClick = function (id) {
            // Change the current active object
            WebGMEGlobal.State.registerActiveObject(id);
        };
    };

    /* * * * * * * * Visualizer content update callbacks * * * * * * * */
    // One major concept here is with managing the territory. The territory
    // defines the parts of the project that the visualizer is interested in
    // (this allows the browser to then only load those relevant parts).
    SimPetriNetFiringControl.prototype.selectedObjectChanged = function (nodeId) {
        const desc = this._getObjectDescriptor(nodeId),
            self = this;

        self._logger.debug("activeObject nodeId '" + nodeId + "'");

        // Remove current territory patterns
        if (self._currentNodeId) {
            self._client.removeUI(self._territoryId);
        }

        self._currentNodeId = nodeId;
        self._currentNodeParentId = undefined;

        if (typeof self._currentNodeId === 'string') {
            // Put new node's info into territory rules
            self._selfPatterns = {};
            self._selfPatterns[nodeId] = { children: 0 }; // Territory "rule"

            self._widget.setTitle(desc.name.toUpperCase());

            // if (typeof desc.parentId === 'string') {
            //     self.$btnModelHierarchyUp.show();
            // } else {
            //     self.$btnModelHierarchyUp.hide();
            // }

            self._currentNodeParentId = desc.parentId;

            self._territoryId = self._client.addUI(self, function (events) {
                self._eventCallback(events);
            });

            // Update the territory
            self._client.updateTerritory(self._territoryId, self._selfPatterns);

            self._selfPatterns[nodeId] = { children: 1 };
            self._client.updateTerritory(self._territoryId, self._selfPatterns);
        }
    };

    // This next function retrieves the relevant node information for the widget
    SimPetriNetFiringControl.prototype._getObjectDescriptor = function (nodeId) {
        var node = this._client.getNode(nodeId),
            objDescriptor;
        if (node) {
            objDescriptor = {
                id: node.getId(),
                name: node.getAttribute(nodePropertyNames.Attributes.name),
                childrenIds: node.getChildrenIds(),
                parentId: node.getParentId(),
                isConnection: GMEConcepts.isConnection(nodeId),
            };
        }

        return objDescriptor;
    };

    /* * * * * * * * Node Event Handling * * * * * * * */
    SimPetriNetFiringControl.prototype._eventCallback = function (events) {
        // var i = events ? events.length : 0,
        //     event;

        // this._logger.debug("_eventCallback '" + i + "' items");

        // while (i--) {
        //     event = events[i];
        //     switch (event.etype) {
        //         case CONSTANTS.TERRITORY_EVENT_LOAD:
        //             this._onLoad(event.eid);
        //             break;
        //         case CONSTANTS.TERRITORY_EVENT_UPDATE:
        //             this._onUpdate(event.eid);
        //             break;
        //         case CONSTANTS.TERRITORY_EVENT_UNLOAD:
        //             this._onUnload(event.eid);
        //             break;
        //         default:
        //             break;
        //     }
        // }

        // this._logger.debug("_eventCallback '" + events.length + "' items - DONE");

        const self = this;
        events.forEach((event) => {
            if (event.eid && event.eid === self._currentNodeId) {
                if (
                    event.etype === CONSTANTS.TERRITORY_EVENT_LOAD ||
                    event.etype === CONSTANTS.TERRITORY_EVENT_UPDATE
                ) {
                    self._rootLoaded = true;
                } else {
                    self.clearPN();
                    return;
                }
            }
        });

        if (events.length && events[0].etype === CONSTANTS.TERRITORY_EVENT_COMPLETE && self._rootLoaded) {
            this._initPN();
        }
    };

    SimPetriNetFiringControl.prototype._onLoad = function (gmeId) {
        var description = this._getObjectDescriptor(gmeId);
        this._widget.addNode(description);
    };

    SimPetriNetFiringControl.prototype._onUpdate = function (gmeId) {
        var description = this._getObjectDescriptor(gmeId);
        this._widget.updateNode(description);
    };

    SimPetriNetFiringControl.prototype._onUnload = function (gmeId) {
        this._widget.removeNode(gmeId);
    };

    SimPetriNetFiringControl.prototype._stateActiveObjectChanged = function (model, activeObjectId) {
        if (this._currentNodeId === activeObjectId) {
            // The same node selected as before - do not trigger
        } else {
            this.selectedObjectChanged(activeObjectId);
        }
    };

    SimPetriNetFiringControl.prototype._initPN = function () {
        const META = this._client
            .getAllMetaNodes()
            .reduce((accum, node) => ({ ...accum, [node.getAttribute('name')]: node.getId() }), {});

        const accumulateNodes = (accum, node) => {
            const id = node.getGuid();
            const name = node.getAttribute('name');
            const position = node.getRegistry('position');
            if (node.isTypeOf(META['Place'])) {
                const tokens = node.getAttribute('marks');
                accum.places.set(id, new Place(name, position, tokens));
                // const entry = { id, entity: new Place(name, position, tokens) };
                // accum.places.push(entry);
            } else if (node.isTypeOf(META['Transition'])) {
                //const entry = { id, entity: new Transition(name, position) };
                //accum.transitions.push(entry);
                accum.transitions.set(id, new Transition(name, position));
            } else if (node.isTypeOf(META['Flow'])) {
                const weight = node.getAttribute('weight');
                const srcId = this._client.getNode(node.getPointerId('src')).getGuid();
                const dstId = this._client.getNode(node.getPointerId('dst')).getGuid();
                const isInputFlow = node.isTypeOf(META['Input Flow']);
                accum.flows.push(new Flow(weight, srcId, dstId, isInputFlow));
            }
            return accum;
        };

        // first iterate over the nodes to collect places and transitions,
        // as well as the flows (in temp variable) as srcId, destId, and weight
        const petriNetElementIds = this._client.getNode(this._currentNodeId).getChildrenIds();
        const petriNet = petriNetElementIds
            .map((id) => this._client.getNode(id))
            .filter((node) => !!node && (node.isTypeOf(META['Node']) || node.isTypeOf(META['Flow'])))
            //.reduce(accumulateNodes, { places: new Map(), transitions: new Map(), flows: [] });
            //.reduce(accumulateNodes, { places: [], transitions: [], flows: [] });
            .reduce(accumulateNodes, { places: new Map(), transitions: new Map(), flows: [] });

        const accumulateWeightMap = (accum, { weight, srcId, dstId }) => {
            if (!accum.has(srcId)) {
                accum.set(srcId, new Map());
            }
            accum.get(srcId).set(dstId, weight);
            return accum;
        };

        petriNet.weights = petriNet.flows.reduce(accumulateWeightMap, new Map());

        // now iterate over the flows to attach inPlaces/outPlaces to transtions and inTranstions/outTranstions to places
        petriNet.flows.forEach(({ srcId, dstId, isInputFlow }) => {
            if (isInputFlow) {
                petriNet.transitions.get(dstId).addInPlace(srcId);
                petriNet.places.get(srcId).addOutTransition(dstId);
            } else {
                petriNet.transitions.get(srcId).addOutPlace(dstId);
                petriNet.places.get(dstId).addInTransition(srcId);
            }
        });
        // now iterate over the flows object to replace add an object ref (plus the weight)
        // to the places and transitions maps
        // petriNet.flows.forEach(({ srcId, dstId, weight }) => {
        //     if (petriNet.places.has(srcId)) {
        //         const dst = petriNet.transitions.get(dstId);
        //         petriNet.places.get(srcId).flows.push({ dst, weight });
        //     } else if (petriNet.transitions.has(srcId)) {
        //         const dst = petriNet.places.get(dstId);
        //         petriNet.transitions.get(srcId).flows.push({ dst, weight });
        //     }
        // });

        //TODO: clear comment if using "flows" field
        // delete the temporary field
        //delete petriNet.flows;

        //petriNet.setFireableTransitions = this.setFireableTransitions;

        this._widget.initPetriNet(petriNet);
    };

    // SimPetriNetFiringControl.prototype.setFireableTransitions = function (transitions) {
    //     this._fireableTransitions = transitions;
    //     debugger;
    // };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    SimPetriNetFiringControl.prototype.destroy = function () {
        this._detachClientEventListeners();
        this._removeToolbarItems();
    };

    SimPetriNetFiringControl.prototype._attachClientEventListeners = function () {
        this._detachClientEventListeners();
        WebGMEGlobal.State.on('change:' + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged, this);
    };

    SimPetriNetFiringControl.prototype._detachClientEventListeners = function () {
        WebGMEGlobal.State.off('change:' + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged);
    };

    SimPetriNetFiringControl.prototype.onActivate = function () {
        this._attachClientEventListeners();
        this._displayToolbarItems();

        if (typeof this._currentNodeId === 'string') {
            WebGMEGlobal.State.registerActiveObject(this._currentNodeId, { suppressVisualizerFromNode: true });
        }
    };

    SimPetriNetFiringControl.prototype.onDeactivate = function () {
        this._detachClientEventListeners();
        this._hideToolbarItems();
    };

    /* * * * * * * * * * Updating the toolbar * * * * * * * * * */
    SimPetriNetFiringControl.prototype._displayToolbarItems = function () {
        if (this._toolbarInitialized === true) {
            for (var i = this._toolbarItems.length; i--; ) {
                this._toolbarItems[i].show();
            }
        } else {
            this._initializeToolbar();
        }
        this.hideValidateSettings();
    };

    SimPetriNetFiringControl.prototype._hideToolbarItems = function () {
        if (this._toolbarInitialized === true) {
            for (var i = this._toolbarItems.length; i--; ) {
                this._toolbarItems[i].hide();
            }
        }
    };

    SimPetriNetFiringControl.prototype._removeToolbarItems = function () {
        if (this._toolbarInitialized === true) {
            for (var i = this._toolbarItems.length; i--; ) {
                this._toolbarItems[i].destroy();
            }
        }
    };

    SimPetriNetFiringControl.prototype.hideValidateSettings = function () {
        if (this._toolbarInitialized === true) {
            this.$validationLabel.hide();
            this.$toggleFreeChoice.hide();
            this.$toggleMarkedGraph.hide();
            this.$toggleStateMachine.hide();
            this.$toggleWorkFlow.hide();
            this.$btnCollapseValidatorSettings.hide();
            this.$btnValidatorSettings.show();
        }
    };

    SimPetriNetFiringControl.prototype.showValidateSettings = function () {
        if (this._toolbarInitialized === true) {
            this.$validationLabel.show();
            this.$toggleFreeChoice.show();
            this.$toggleMarkedGraph.show();
            this.$toggleStateMachine.show();
            this.$toggleWorkFlow.show();
            this.$btnCollapseValidatorSettings.show();
            this.$btnValidatorSettings.hide();
        }
    };

    SimPetriNetFiringControl.prototype._initializeToolbar = function () {
        const self = this;
        const { Toolbar } = WebGMEGlobal;

        this._toolbarItems = [];

        this._toolbarItems.push(Toolbar.addSeparator());

        /************** Go to hierarchical parent button ****************/
        // this.$btnModelHierarchyUp = Toolbar.addButton({
        //     title: 'Go to parent',
        //     icon: 'glyphicon glyphicon-circle-arrow-up',
        //     clickFn: function (/*data*/) {
        //         WebGMEGlobal.State.registerActiveObject(self._currentNodeParentId);
        //     },
        // });
        // this._toolbarItems.push(this.$btnModelHierarchyUp);
        // this.$btnModelHierarchyUp.hide();

        //TODO: vvv?????
        //this.$x = Toolbar.add(ToolbarItem????)
        // ^^^ ToolbarItem is just { el: {...item...} }
        //      and "item" is something custom similar to what's returned from ToolbarToggleButton, ToolbarButton, etc...

        //toggleButton has:
        /* 
            clickFn
            title
            text
            data -> sent to button.data(params.data); <--- jQuery method (stores data to be looked up later)
            icon
            clickFnEventCancel (true to stopPropagation and preventDefault)
        */

        this.$validationLabel = Toolbar.addLabel();
        this.$validationLabel.text('Validate for:');
        this._toolbarItems.push(this.$validationLabel);

        this.$toggleStateMachine = Toolbar.addToggleButton({
            //icon: 'glyphicon glyphicon-cloud',
            text: 'StateMachine',
            title: 'State Machine',
        });
        this.$toggleStateMachine.setToggled(true);
        this._toolbarItems.push(this.$toggleStateMachine);

        this.$toggleMarkedGraph = Toolbar.addToggleButton({
            //icon: 'glyphicon glyphicon-cloud',
            text: 'MarkedGraph',
            title: 'Marked Graph',
        });
        this.$toggleMarkedGraph.setToggled(true);
        this._toolbarItems.push(this.$toggleMarkedGraph);

        this.$toggleFreeChoice = Toolbar.addToggleButton({
            //icon: 'glyphicon glyphicon-cloud',
            text: 'FreeChoice',
            title: 'Free-Choice',
        });
        this.$toggleFreeChoice.setToggled(true);
        this._toolbarItems.push(this.$toggleFreeChoice);

        this.$toggleWorkFlow = Toolbar.addToggleButton({
            //icon: 'glyphicon glyphicon-cloud',
            text: 'WorkFlow',
            title: 'WorkFlow',
        });
        this.$toggleWorkFlow.setToggled(true);
        this._toolbarItems.push(this.$toggleWorkFlow);

        this.$btnValidatorSettings = Toolbar.addButton({
            icon: 'glyphicon glyphicon-wrench',
            title: 'validator settings',
            clickFn: function () {
                self.showValidateSettings();
            },
        });
        this._toolbarItems.push(this.$btnValidatorSettings);

        this.$btnCollapseValidatorSettings = Toolbar.addButton({
            icon: 'glyphicon glyphicon-menu-left',
            title: 'collapse settings',
            clickFn: function () {
                self.hideValidateSettings();
            },
        });
        this._toolbarItems.push(this.$btnCollapseValidatorSettings);

        //x

        this._toolbarItems.push(Toolbar.addSeparator());

        this.$btnDefaultInterpret = Toolbar.addButton({
            title: 'validate',
            icon: 'glyphicon glyphicon-ok',
            clickFn: function () {
                const context = self._client.getCurrentPluginContext('validatePetriNet', self._currentNodeId, []);
                context.pluginConfig = {};
                self._client.runServerPlugin('validatePetriNet', context, function (err, result) {
                    // self._client.runBrowserPlugin('validatePetriNet', context, function (err, result) {
                    if (err === null) {
                        const output = result.messages.map(({ message }) => message).join('\n');
                        alert(output);
                    }
                    //TODO: if/else
                    // console.log('plugin err:', err);
                    // console.log('plugin result:', result);
                    //alert(result);
                });
            },
        });
        this._toolbarItems.push(this.$btnDefaultInterpret);

        /* 
            see over there! (anything i can use?) -->
        this.CONSTANTS
        this.GMEConcepts
        this.nodePropertyNames


        TODO: the spacing is fucked up

        TODO: or just fuck it, do only a single "validate" option and upgrade it alter if time/necessary
        TODO: ALSO GET SOME FONT-AWESOME ICONS WORKING!!!! (b/c glyphicon sucks in comparison)
        
        */

        //this.$colors = Toolbar.addColorPicker()

        /* 
        class Toolbar {
            constructor(element: Element);
            add(item: ToolbarItem): ToolbarButton;
            addButton(params: ToolbarParams): ToolbarButton;
            addSeparator(): ToolbarSeparator;
            addRadioButtonGroup(clickFn: ClickFn): ToolbarRadioButtonGroup;
            addToggleButton(params: ToolbarParams): ToolbarToggleButton;
            addTextBox(params: ToolbarParams): ToolbarTextBox;
            addLabel(): ToolbarLabel;
            addCheckBox(): ToolbarCheckBox;
            addDropDownButton(params: ToolbarParams): ToolbarDropDownButton;
            addColorPicker(params: ToolbarParams): ToolbarColorPicker;

            refresh(): void;
        }
        
        */

        /**
         * available are:
         * ToolbarButton
         * ToolbarCheckBox
         * ToolbarColorPicker
         * ToolbarDragItem
         * ToolbarDropDownButton
         * ToolbarLabel
         * ToolbarRadioButtonGroup
         * ToolbarTextBox
         * ToolbarToggleButton
         *
         * ToolbarSeparator
         *
         * ToolbarItemBase
         * ButtonBase
         *
         * Toolbar
         */

        this._toolbarInitialized = true;
    };

    return SimPetriNetFiringControl;
});
