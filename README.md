# Select2 component for Derby JS 

This is a [DerbyJS](http://github.com/codeparty/derby) component for jQuery Select2 4.0.
It features some improved usability, and it adds support for re-ordering multi-selections with drag-and-drop.


## Design

* dataAdapter: class; a simple EventEmitter class
* selectionAdapter: string; the name of a DerbyJS view (component)
* resultsAdapter: string; the name of a DerbyJS view (component)


Data flow:

input: model path "data"
 -> dataAdapter: normalize data items to results
 -> select2 user interaction
 -> dataAdapter on "select", "unselect" writes selections to model path "selections"

dataAdapter is also the link between "selections" (normalized) and the output model path "value". It reads changes from "value" and writes them to "selections", as well as the other way around.

Thus, dataAdapters do two things:

  - normalize (from data to results and from value to selections)
  - add and remove items to and from value using items in data.

And, a data adapter filters according to query arguments (paging) and a model path (filtering).


Signals:

* opening the dropdown emits "query"

* "query" starts getting the data from the dataAdapter - if no query is necessary, "queryEnd" is emitted right away
* "query" opens the dropdown
* query adds "loading" message
* queryEnd removes "loading" message




configuration options:
    resultsTemplate, selectionTemplate:
        Provide a view name to use. It will get an `item` attribute passed.

        If you need to pass and get more data, make the view a component and get the data
        from the options you passed to Select2 by calling `this.parent.model.get('options')`



NOT TO BE PUBLISHED, NOTES:
===========================

Core:
  receives all keypresses and reacts to Esc (close), Space (toggle selection), Return (select),
  Up (next), Down (prev)

Selection:
  The elements that were selected, or the element that has been selected. You can click on it
  and thereby deselect it and/or toggle the dropdown. It can receive keypresses and simply
  forwards them.

  signals:
    keypress
    toggle
    unselect (if multiple)

  slots from container:
    results:focus (to set aria-activedescendant)

    open
    close
    enable
    disable

Results:
  The dropdown with all selectable items. Can be filtered.
  The class `select2-results__option--highlighted` is added to a focused (mouseenter) item.
  When an item is focused, the Selection class has to be informed to set aria-activedescendant.

  model:
    message
    results  (TODO)
    loading
    current (to hold the currently highlighted/focused element -- update/change it with every
        mousehover/enter/leave event)

  parent model paths:
    selections

  interface:
    displayMessage
    showLoading
    append  (to add items)

  signals:

  slots from container:
    results:all
    results:append
    query (to show loading until results:all/append)
    select/unselect: setClasses
    open
    close
    results:toggle (toggle selection of current element)
    results:select (select current element)
    results:previous
    results:next
    results:focus
    results:message

  self:
    mouseup
    mouseenter


## Differences to jQuery Select2



* no RelayEvents

  There is no original $element anymore that needs the events relayed to.

* no SelectAdapter, no ArrayAdapter

  I don't think a SelectAdapter makes sense in case of DerbyJS, neither does the ArrayAdapter.
  Why would you create options from some data and then convert the options back to data?
  And an array can be passed using the model.


### Additional features

- reorder the selection with drag&drop
- select an item multiple times if "duplicates" is enabled




## Dependencies

* [Sortable](http://rubaxa.github.io/Sortable)


## Usage

### In your app

```javascript
// Use component published as module
app.component(require('derby-select2'));
```

### In your template

```html
<view name="d-select2" fixed attr="{{entity.attributes.users}}" value="{{data}}"></view>
```

Supported attributes:

attribute | meaning
------|------
fixed | boolean; if given, no new items may be added (allowing that is not implemented yet)
value | model path where to store the selections, e.g. `"{{data}}"`
attr  | an attribute object of an entity, this determines the items that can be selected


## TODO

Turn this component into an actual Derby view to make it reactive instead of using select2's jQuery DOM rendering code.


## License

MIT

Copyright (c) 2015 Michael Brade
