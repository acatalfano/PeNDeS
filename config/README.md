# PeNDeS - Petri Net Development Studio

## About the Domain

PeNDeS is a development studio for building models in the petri net domain.
A petri net is a model composed of places and transitions connected by arcs.
Arcs are directed edges that connect either a place to a transition or a transition to a place.

Places have an associated "mark", which is a number describing a token-count attached to that place.
The tokens are graphically shown in the petri net models as black dots inside the places, which themselves
are depicted as white circles. The transitions are depicted as black boxes.

The arcs also have a weight associated with them, which comes into play with the petri-net's firing rules.

A petri net represents potential progression of a state over time, in accordance with its firing rules.
A transition can fire if all of the "in-places" (places that have an arc pointing to the transition in question)
have at least as many tokens as are asked for by the arc's weight.
If a transition can fire and is elected to fire, then each in-place's token-count is subtracted by the value of
the weight of the arc that connects that place to the firing transition.
After this happens, tokens are added to the "out-places". The out-places are all of the places that the firing transition
has arcs pointing towards. The amount of tokens added to an out-place is also determined by the weight on the arc leading from
the firing transition to each out-place.

## Typical Use-Cases

Petri Nets are often used to model concurrent processes and decision-processes.
They can also be used to model state machines.
Any process that can be constrained by a certain number of resources is also a good candidate for a petri net model.

Some example use-cases are provided in the "petri_nets" seed.
They include 2 variants of the classic elevator model. One of which consists of 2 places and up-and-down transitions.
In this variant, the state of the elevator is the union of both places and tokens get passed between the places as
decisions are made to go up or down. The number of tokens restricts the elevator from going past floor 3 or below floor 1.

The other variant of the elevator model consists of 3 places (1 for each floor) and 4 transitions
(1st-to-2nd, 2nd-to-1st, 2nd-to-3rd, and 3rd-to-2nd). There is only one token and the place that has the token is the current
state of the elevator.

A 3rd example is a workflow of an "upsert" operation on a database. "Upsert" is a clever contraction of the words
"update" and "insert". It's a generic operation that bears the responsibility of determining if the entity already exists,
so it needs to pick whether to perform an update on an existing entity, or insert a new entity.
A workflow always has one source and one sink place. In this workflow, all of the tokens start at the source, "upsert requests".
From this place, the "insert" or "update" transition may be selected (per token, but not both). The "update" path is easy,
there's one place ("update person fields"), which goes to one transition ("finish update"), which leads to the sink ("complete upserts").

The "insert" path is more complicated. First a person must be created ("create person" place), then a transition is made through
"build related data", which sends a token to 3 places ("create address", "create username", "create password"). These represent 3 parallel processes.
The person data had to be created first, but then all 3 of the subordinate processes can then proceed in any order.
All of the 3 sub-process places point to the "finish insert" transition, which also points to the source place.

## Installation

There are a few dependencies that need to be installed. `Node.js`, a package manager (`pnpm`, `yarn`, or `npm`), `mongoDb`, and `python`.

### Node.js

Install the latest LTS [Node.js](https://nodejs.org/en/). This should also install `npm`, but feel free to use `pnpm` or `yarn` instead.

### Python

Install [Python 3](https://www.python.org/downloads/)

### MongoDb

Install [MongoDb Community](https://docs.mongodb.com/manual/administration/install-community/)
If you're on a Windows system, it's recommended to follow the instructions to setup MongoDb as a Windows service, so you can avoid needing to
start `MongoDb` whenever you want to launch PeNDeS.

### Setup

You'll need to add Python3 to your PATH environment variables.
Next you will need to clone the repository. Open a terminal in the parent directory you wish to contain PeNDeS, and run the clone command:
`git clone https://github.com/acatalfano/PeNDeS.git`
Then go into the PeNDeS directory `cd pendes`.

Install all of the node dependencies, using whichever package manager you prefer.
`pnpm i`
`yarn i`
`npm i`

## Building a Model

Start by launching the PeNDeS app.
If you didn't setup mongo as a windows service, you'll first need to run `mongod` in a terminal.
Next, from the PeNDeS directory, you'll need to run `npm start` (or `node ./app.js`).

After running this command, you should see only a handful of lines of terminal output, all starting with a timestamp, followed by `- info:`.
The last line should end with `Server is listening ...`.
If you see something different, something was likely installed improperly or the PATH variable needs to be updated.

Open a browser and navigate to `http://localhost:8888` to enter PeNDeS.
If you've already started a project, you can select it from the dialog that pops up.
If this is you first time here, or if you want to start a new project, select `create new` in the bottom-left of the dialog.
Enter the name you want for your project and select `create`.

A new dialog will pop up. You can duplicate a project you've made before (under the `duplicate` tab) or you can use the petri net seed
by selecting `petri_net` from the dropdown in the `seed` tab (the default). Then click `create`.

You should be able to see some sample models to give you an idea of what a petri net can be used for.
Select `Composition` on the left pane if it's not already selected and be sure that the middle pane says `ROOT` in the upper-left.
If not, you can double-click on `ROOT` in the right pane under the `Composition` tab.

Drag the icon labeled `Petri Net` from the left pane onto the middle pane to create a petri net model. Double-click on the text in the middle pane
to change the name of the petri net, and double-click on the icon itself to go into the petri net and start building your model.
You can get out of this view by using the `Composition` tab in the object browser or by clicking the up-arrow icon in the top toolbar.

You can start dragging transitions and places into your model. Rename them in the same way as with the petri-net icon. For the places, you can
single-click on them, then in the right pane, in the lower half (the property editor), select the `attributes` tab to change the `marks` value.
This is the number of tokens starting off in this place.

Now you can start connecting your transitions and places with arcs. Drag from the origin place/transition to the destination place/transition.
You can edit the weight the same way as you edit a place's marks. Click on the arc that was created, and change the weight value in the
property editor's attributes tab.

## Additional Features

PeNDeS features a similator and an interpreter for your models.
Go inside a petri net model you've created, either by clicking on it in the middle view, or by selecting it from the object browser's composition
tab in the right side pane.

Select `SimPetriNetFiring` from the `Visualizer Selector` in the left side pane.
You should see a more-or-less faithful recreation of your model.

The similator visualizes the firing of transitions and the progression of the model's state as these transitions fire.
A gray transition is inactive (not able to fire currently, due to the tokens it requires from in-places),
whereas a black transition is active (can fire because the in-places all satisfy its token requirements).
Fire an active transition by double-clicking on it. As the tokens redistribute, some previously inactive transitions may become active and vice-versa.

Additionally, the `SimPetriNetFiring` visualizer comes equipped with an interpretter. It tells you which of 4 categories of petri nets yours
satisfies (potentially none or multiple). The 4 categories are:

1. Free-Choice Petri Net - Each transition has its own unique set of in-places.
2. State Machine - Every transition has exactly one in-place and one out-place.
3. Marked Graph - Every place has exactly one in-transition and one out-transition.
4. Workflow Net - There is exactly one source place (has no in-transitions), and one sink place (has no out-transitions).
    Additionally, every non-sink non-source place and every transition is along a path from the source to the sink.

The interpretter is used via the top toolbar. Select the wrench to open additional options where you can select which categories you wish to test.
You can then click the left-arrow icon to close the options that appeared when you're done with your selection.
To run the interpretter, click the checkmark icon. See your results in the `notifications` drop-up menu located at the bottom-right of the screen
