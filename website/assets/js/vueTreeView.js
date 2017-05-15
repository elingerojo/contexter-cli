const DOT_NOTATION_STRING = '.' // spaces around dot for easy visualization

Vue.component("console-view", Vue.extend({
	name: "console-view",
  props: ["data"],
  methods: {
    isError: function(value){
      // Set error ONLY when `value.output` starts with any of the ...
      // ... error strings in the array
      // ( must match `tree-view` method `transformValue()` error handling ...
      // ... message + 1 because once converted to string it starts and ends ...
      // ... with double-quote characters like `"SyntaxError: ..."` )
      return (typeof
        // `find` return a string or `undefined` so, if not `undefined` ...
        // ... means, string found (that means, it is an error)
        ['SyntaxError', 'YAMLException'].find(errorText => {
          return value.output.indexOf(errorText) === 1
        })
        != 'undefined')
    }
  },
  computed: {
    content: function () {
      return this.data.consoleData
    }
  },

  template:`
  <div class="console-view">
  <div class="console-view-comment">// Click any property above to open until you hit an "end leaf"</div>
  <span><span class="code-var">console.log</span>(&nbsp;</span><span class="console-view-wrapper"><span class="console-view-input" :data="content">{{content.input}}</span></span><span>&nbsp;);</span><br>
  <span>&gt;&nbsp;<span :class="{redFlagged: isError(content)}">{{content.output}}</span></span>
  </div>
  `
}));

Vue.component("tree-view-item", Vue.extend({
	name: "tree-view-item",
  props: ["data", "max-depth", "current-depth", "focus-node"],
  data: function(){
  	return {
      open: this.currentDepth < this.maxDepth,
      lastPath: this.focusNode
    }
  },
  methods: {
    isOpen: function(){
    	return this.isRootObject(this.data) || this.open;
    },
    toggleOpen:function(){
    	this.open = !this.open;
    },
  	isObject: function(value){
    	return value.type === 'object';
    },
  	isArray: function(value){
    	return value.type === 'array';
    },
    isValue: function(value){
    	return value.type === 'value';
    },
    getKey: function(value){
    	if (_.isInteger(value.key)) {
      	return value.key+":";
      } else {
	      return "\""+ value.key + "\":";
      }
    },
    getValue: function(value){
    	if (_.isNumber(value.value)) {
      	return value.value
      }
      if (_.isNull(value.value)) {
      	return "null"
      }
      if (_.isString(value.value)) {}
    	return "\""+value.value+"\"";
    },
    isRootObject: function(value){
    	return value.isRoot;
    },
    isError: function(value){
    	return value.isError;
    }
  },
  // TODO: Change logic to detect click on directory
  // check before EVERY update
  beforeUpdate: function () {
    // Only when path changes (meaning, click on directory)
    if (this.focusNode !== this.lastPath) {
      // if open state is different than desired, then toggle it
      let toState = this.focusNode.indexOf(this.data.name) > -1
      if (toState != this.open) {
        this.toggleOpen()
      }
      // Save path to detect future change
      this.lastPath = this.focusNode
    }
  },
  template:`
  	<div class="tree-view-item">
    	<div v-if="isObject(data)" class="tree-view-item-leaf">
      	<div class="tree-view-item-node" @click.stop="toggleOpen()">
       		<span :class="{opened: isOpen()}" v-if="!isRootObject(data)" class="tree-view-item-key tree-view-item-key-with-chevron">{{getKey(data)}}</span>
          <span :class="{redFlagged: isError(data)}" class="tree-view-item-hint" v-show="!isOpen() && data.children.length === 1">{{data.children.length}} property</span>
          <span :class="{redFlagged: isError(data)}" class="tree-view-item-hint" v-show="!isOpen() && data.children.length !== 1">{{data.children.length}} properties</span>
        </div>
				<tree-view-item :max-depth="maxDepth" :current-depth="currentDepth+1" :focus-node="focusNode" v-show="isOpen()" v-for="child in data.children" :data="child" :key="data.key"></tree-view-item>
      </div>
    	<div v-if="isArray(data)" class="tree-view-item-leaf">
      	<div class="tree-view-item-node" @click.stop="toggleOpen()">
       		<span :class="{opened: isOpen()}" v-if="!isRootObject(data)" class="tree-view-item-key tree-view-item-key-with-chevron">{{getKey(data)}}</span>
          <span :class="{redFlagged: isError(data)}" class="tree-view-item-hint" v-show="!isOpen() && data.children.length === 1">{{data.children.length}} item</span>
          <span :class="{redFlagged: isError(data)}" class="tree-view-item-hint" v-show="!isOpen() && data.children.length !== 1">{{data.children.length}} items</span>
        </div>
				<tree-view-item :max-depth="maxDepth" :current-depth="currentDepth+1" :focus-node="focusNode" v-show="isOpen()" v-for="child in data.children" :data="child" :key="data.key"></tree-view-item>
      </div>
    	<div v-if="isValue(data)" class="tree-view-item-leaf">
        <span class="tree-view-item-key" :title="data.breadcrums" :output="data.value.toString()" onclick="sendToConsole( this.getAttribute('title'), this.getAttribute('output') )">{{getKey(data)}}</span>
        <span :class="{redFlagged: isError(data)}" class="tree-view-item-value" :title="data.breadcrums" :output="data.value.toString()" onclick="sendToConsole( this.getAttribute('title'), this.getAttribute('output') )">{{getValue(data)}}</span>
			</div>
    </div>
  `
}));

Vue.component("tree-view", Vue.extend({
	name: "tree-view",
  props: ["data", "max-depth"],
  methods: {
   // Since we use lodash, the _.map method will work on
   // both Objects and Arrays, returning either the Key as
   // a string or the Index as an integer
   generateChildrenFromCollection: function (collection, breadcrums, path) {
     let _this = this

     function sortKeysInside(obj) {
       // First group by the value type of each key (object, array or value)
       var oKeys = [];
       var aKeys = [];
       var vKeys = [];
       for (let key in obj) {
         if (_this.isObject(obj[key])) oKeys.push(key);
         if (_this.isArray(obj[key]) ) aKeys.push(key);
         if (_this.isValue(obj[key]) ) vKeys.push(key);
       }
       // Second, sort each group and concatenate in object-array-value order
       let keys = [].concat(oKeys.sort(), aKeys.sort(), vKeys.sort());

       // Finally, build back a sorted obj to return
       let sorted = {}
       for (let j = 0; j < keys.length; j++) {
         let item = keys[j];
         sorted[item] = obj[item]
       }
       return sorted
     }

     // Only sort if collection is an object (arrays are already sorted)
     let sortedCollection = ( this.isObject(collection) )
         ? sortKeysInside(collection)
         : collection

     return _.map(sortedCollection, (value, keyOrIndex)=>{
         if (this.isObject(value)) {
           return this.transformObject(value, keyOrIndex, breadcrums, path);
         }
         if (this.isArray(value)) {
           return this.transformArray(value, keyOrIndex, breadcrums, path);
         }
         if (this.isValue(value)) {
           return this.transformValue(value, keyOrIndex, breadcrums);
         }
       }) ;
    },
    // Transformer for the Object type
  	transformObject: function(objectToTransform, keyForObject, breadcrums, path, isRootObject = false){
      let objectNode  = {
                        	key: keyForObject,
                        	type: "object",
                          isRoot: isRootObject,
                          name: path + '/' + keyForObject,
                          children: this.generateChildrenFromCollection(
                                      objectToTransform,
                                      this.resolveNotation(breadcrums, keyForObject),
                                      path + '/' + keyForObject
                                    )
                        }
      objectNode.isError = objectNode.children.find(child => child.isError)
                              && !isRootObject
      return objectNode
    },
  	// Transformer for the Array type
    transformArray: function (arrayToTransform, keyForArray, breadcrums, path) {
      let arrayNode = {
                      	key: keyForArray,
                        type: "array",
                        children: this.generateChildrenFromCollection(
                                    arrayToTransform,
                                    this.resolveNotation(breadcrums, keyForArray),
                                    path + '/' + keyForArray
                                  )
                      }
      arrayNode.isError = arrayNode.children.find(child => child.isError)
      return arrayNode
    },
    // Transformer for the non-Collection types,
    // like String, Integer of Float
    transformValue: function (valueToTransform, keyForValue, breadcrums) {
    	return {
      	key: keyForValue,
        type: "value",
        value: valueToTransform,
        breadcrums: this.resolveNotation(breadcrums, keyForValue),
        // Set error ONLY when `valueToTransform` starts with any of the ...
        // ... error strings in the array
        // (must match `parseCallback()` error handling message)
        isError: (typeof
          // `find` return a string or `undefined` so, if not `undefined` ...
          // ... means, string found (that means, it is an error)
          ['SyntaxError', 'YAMLException'].find(errorText => {
            return valueToTransform.toString().indexOf(errorText) === 0
          })
          != 'undefined')
      }
    },
    // Helper Methods for value type detection
    isObject: function(value){
    	return _.isPlainObject(value);
    },
    isArray: function(value){
    	return _.isArray(value);
    },
    isValue: function(value){
    	return !this.isObject(value) && !this.isArray(value);
    },
    // Resolve between bracket and dot notation (on hover titles for leaf items)
    resolveNotation (breadcrums, key) {
      // No quotes around integer keys (like array's indexes)
      let bracketedKey = ( _.isInteger(key) ) ? '[' + key + ']' : '[\'' + key + '\']'
      // Hack to remove unintentional dot before root node
      if (_.startsWith(breadcrums, DOT_NOTATION_STRING))
          breadcrums = breadcrums.slice(DOT_NOTATION_STRING.length)
      // Put brackets around key if needed (otherwise, use dot notation)
      return ( unquotedValidator(key.toString()).needsBrackets )
          ? breadcrums + bracketedKey
          : breadcrums + DOT_NOTATION_STRING + key
    }
  },
  computed: {
  	parsedData: function () {
    	// Take the JSON data and transform
      // it into the Tree View DSL
      // ('context' is the notation root value and breadcrums starts empty)
	    return this.transformObject(this.data.dirData, "context", "", "", true);
    },
    focusNode: function () {
      return this.data.focusPath
    }
  },
  template: `
  	<div class="tree-view-wrapper">
    	<tree-view-item class="tree-view-item-root" :data="parsedData" :max-depth="maxDepth" :currentDepth="0" :focus-node="focusNode"></tree-view-item>
    </div>`
}));

var vm = new Vue({
	el: "#vue-root",

  data: {
    dataGroup: {
      dirData: null,
      focusPath: '',
      consoleData: {
        input: '',
        output: ''
      }
    }
  },

  created: function () {
    var _this = this;

    // Establish SSE connection
    var source = new EventSource('/events');

    // Define what to do when SSE received
    source.onmessage = function(e) {
      var payload = JSON.parse(e.data)
      if (payload.action === 'reload') {
        // Reload data every time SSE sends 'reload' message (ignore 'ping' msg)
        _this.getData()
      }
    };

    // First data load (only once when created)
    this.getData()
  },

  methods: {
    getData: function () {
      var _this = this;
      $.getJSON('dirData.js?d='+(new Date()).toLocaleTimeString().split(' ')[0], function (json) {
        _this.dataGroup.dirData = json;

        // Fill jsTree
        context = json
        // Find the only key that is not array (it is root)
        var root = Object.keys(context).find(key => {
          return !(context[key] instanceof Array)
        })
        $('#dir').jstree(contexterToJsTree(root, context[root]));

        //
        // jsTree - functions
        //
        function contexterToJsTree (rootName, rootNode) {
          // Just one slash in between
          var path = '/context/'.concat(rootName).replace('//','/')
          var nodes = {'core': {'data': [{
            text: rootName,
            icon: 'jstree-folder',
            children: []
          }]}}

          function getChildren(current, levelChildren, path) {
            Object.keys(current).forEach(key => {
              var val = current[key]
              if (val && val.path && val.path.base) {
                // its a file
                levelChildren.push({
                  text: val.path.base,
                  icon: 'jstree-file',
                  a_attr: {path:path + '/' + val.path.base, onclick:"openContextAt( this.getAttribute('path') )"}
                })
              } else {
                // its a dir
                levelChildren.push({
                  text: key,
                  icon: 'jstree-folder',
                  children: getChildren(current[key], [], path + '/' + key ),
                  a_attr: {path:path + '/' + key, onclick:"openContextAt( this.getAttribute('path') )"}
                })
              }
            })
            return levelChildren
          }

          nodes.core.data[0].children = getChildren(rootNode, [], path)
          return nodes
        }

      });
    }
  }
})

// Called when click on directory tree
function openContextAt(path) {
  vm.dataGroup.focusPath = path
}

// Called when click on directory tree
function sendToConsole(input, output) {

  function getValue (val) {
    if (val == "true" || val == "false" || val == "null" || val == "undefined") return val
    if (parseFloat(val) !== NaN && parseFloat(val).toString() == val) return parseFloat(val)
    return "\"" + val + "\""
  }

  vm.dataGroup.consoleData.input = input
  vm.dataGroup.consoleData.output = getValue(output)
}
