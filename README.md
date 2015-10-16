# Select2 component for Derby JS 

This is a [DerbyJS](http://github.com/codeparty/derby) component for jQuery Select2 4.0.
It features some improved usability, and it adds support for re-ordering multi-selections with drag-and-drop.


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
