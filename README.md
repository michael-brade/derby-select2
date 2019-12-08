# Select2 component for DerbyJS

This is a [DerbyJS](http://github.com/derbyjs/derby) component for jQuery Select2 4.0.

It features some improved usability, and it adds support for

* re-ordering multi-selections with drag&drop using [Sortable](https://sortablejs.github.io/Sortable/)
* allowing to select an item repeatedly in multi-selection mode
* supports ES6 and is written in ES6

The html-structure is exactly identical to the jQuery Select2 component, so styles can be simply reused. You will still
most likely recognize the resemblance to the original jQuery Select2 code, but using Derby, much less code is required.

## Installation

```sh
npm install derby-select2
```

## Usage

### In your app

```js
// Use component published as module
app.component(require('derby-select2'));
```

### In your template

```html
<select2 id="select2-id12345" class="form-control" options="{{select2options}}" data="{{items}}" value="{{data}}" />
```


## Design

### Components/Views

There are five main components that make up Select2:

* "core" is the main view, parent of all others
* "results" is the contents of the dropdown and shows the selectable items.
* "selection/multiple" and "selection/single" are the selection views: they show what has already been selected
* "search" is used to filter the results (by dropdown and multiple)

The views can be configured using the following options:

* `selectionAdapter`: string; the name of a DerbyJS view (component) that is to be used as selection view
* `resultsAdapter`: string; the name of a DerbyJS view (component) that should display the selectable items

Both, the `selectionAdapter` and the `resultsAdapter`, will get an `item` attribute (not normalized) passed.
If you need to pass and get more data, make the view a component and get the data from the options you passed
to Select2 by calling `this.parent.model.get('options')`.

The model is set up using a data adapter; it is configured using:

* `dataAdapter`: class; a simple EventEmitter class, needs to set up the model and normalization. And, a data adapter
  filters according to query arguments (paging) and a model path (filtering).


### Model

input paths:

* "data": an array with all possible selectable items

output paths:

* "value": where to store the array with the selected item(s)

configuration path:

* "options": where all the Select2 options are stored

model paths for internal Select2 use:

* focus (bool): true if Select2 has focus
* open (bool): true if dropdown open
* results (array): filtered and sorted selectable items to show in dropdown
* selections (array): selected items
* highlighted: the currently highlighted item (replaces results:focus event)


### Events/Signals

The events that can be emitted are:

* open, close, query, queryEnd, select, move, unselect, focus, blur, disable, enable
* opening, closing, selecting, unselecting
* results:select, results:toggle, results:previous, results:next, results:first, results:last

Explanation:

* opening the dropdown emits "query"

* "query" starts getting the data from the dataAdapter - if no query is necessary, "queryEnd" is emitted right away
* "query" opens the dropdown
* query adds "loading" message
* queryEnd removes "loading" message



### Data flow

The (default) model data adapter sets up the following references:

* data -> results
  Takes the items from model path "data" (array) and normalizes, filters, and sorts it to "results" (array).

* data -> value
  On select/move/unselect events it copies or moves the item of the event to value, or deletes the item from value.

* value -> selections
  Takes input from model path "value" and normalizes it to "selections".

Normalization is internal to Select2, and it means how to get those attributes: `id`, `title`, `text`, `children`, `disabled`.

"results" contains normalized items and is thus an array of objects with this structure:

```js
data: {
    item: <original item>,
    id: item.id,
    title: item.title,
    text: item.text,
    children: item.children,
    disabled: item.disabled,
    selected: true/false
}
```

## Differences to jQuery Select2

* no RelayEvents

  There is no original $element anymore that needs the events relayed to.

* no SelectAdapter, no ArrayAdapter

  I don't think a SelectAdapter makes sense in case of DerbyJS, neither does the ArrayAdapter.
  Why would you create options from some data and then convert the options back to data?
  And an array can be passed using the model.




## License

MIT

Copyright (c) 2015-2016 Michael Brade
