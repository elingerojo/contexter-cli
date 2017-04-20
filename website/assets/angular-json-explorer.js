var context;
angular.module('ngJsonExplorer', [])
.directive('jsonExplorer', ['$http', function ($http) {
	'use strict';
	return {
		restrict: 'E',
		scope: {
			data: '=',
			jsonData: '=',
			url: '=',
			collapsed: '=',
			sortBy: '='
		},
		link: function (scope, elem, attrs) {
			if (!angular.isBoolean) {
				angular.isBoolean = function (value) {
					return typeof value == 'boolean';
				}
			}
			var collapser = '+';
			var ellipsis = '';
			var contents = 'hidden';
			if (scope.collapsed) {
				collapser = '-';
				ellipsis = 'hidden';
				contents = '';
			}
			var isRaw = function (v) {
				return (angular.isString(v) || angular.isNumber(v) || angular.isBoolean(v) || v === null);
			};
			var isArray = function (v) {
				return angular.isArray(v);
			};
			var isObject = function (v) {
				return angular.isObject(v);
			};
			var parseRaw = function (k, v) {
				var key = '';
				if (k) {
//          breadcrums = breadcrums + ' . ' + k
					key = '<span class="prop>">' + k + '</span>: ';
//          breadcrums = breadcrums.substring(0, breadcrums.lastIndexOf(' . '))
				}
				if (typeof v == 'string') {
					return key + '<span class="string" title="'+breadcrums+'">"' + v + '"</span>';
				}
				if (typeof v == 'number') {
					return key + '<span class="num" title="'+breadcrums+'">' + v + '</span>';
				}
				if (typeof v == 'boolean') {
					return key + '<span class="bool" title="'+breadcrums+'">' + v + '</span>';
				}
				return key + '<span class="null" title="'+breadcrums+'">' + v + '</span>';
			};
			var parseArray = function (k, v) {
				var html = '<span class="prop>"><a href="#" class="collapser">' + collapser + '</a></span> [';
				if (k) {
					html = '<span class="prop>"><a href="#" class="collapser">' + collapser + '</a>' + k + '</span>: [';
				}
				html += '<span class="ellipsis ' + ellipsis + '">...</span>';
				html += '<ul class="array collapsible ' + contents + '">';
				for (var i = 0; i < v.length; i++) {
          breadcrums = breadcrums + '[' + i + ']'
				  if (isRaw(v[i])) {
						html += '<li>' + parseRaw(null, v[i]) + ',</li>';
					} else if (isArray(v[i])) {
						html += '<li>' + parseArray(null, v[i]) + ',</li>';
					} else if (isObject(v[i])) {
						html += '<li>' + parseObject(null, v[i]) + ',</li>';
					}
          breadcrums = breadcrums.substring(0, breadcrums.lastIndexOf('['))
				}
				html = html.replace(/,<\/li>$/gim, '</li>');
				html += '</ul>';
				html += ']';
				return html;
			};
			var parseObject = function (k, v) {
				var html = '<span class="prop>"><a href="#" class="collapser">' + collapser + '</a></span> {';
				if (k) {
					html = '<span class="prop>"><a href="#" class="collapser">' + collapser + '</a>' + k + '</span>: {';
				}
				html += '<span class="ellipsis ' + ellipsis + '">...</span>';
				html += '<ul class="object collapsible ' + contents + '">';
//				for (var item in v) {
        var keys = [];
        for (let key in v) keys.push(key);
        keys.sort();

        for (let j = 0; j < keys.length; j++) {
          let item = keys[j];

          var validatorResult = unquotedValidator(item)
          if (validatorResult.needsBrackets) {
            breadcrums = breadcrums + '[\'' + item + '\']'
          } else {
            breadcrums = breadcrums + ' . ' + item
          }

					if (isRaw(v[item])) {
						html += '<li>' + parseRaw(item, v[item]) + ',</li>';
					} else if (isArray(v[item])) {
						html += '<li>' + parseArray(item, v[item]) + ',</li>';
					} else if (isObject(v[item])) {
						html += '<li>' + parseObject(item, v[item]) + ',</li>';
					}

          if (validatorResult.needsBrackets) {
            breadcrums = breadcrums.substring(0, breadcrums.lastIndexOf('['))
          } else {
            breadcrums = breadcrums.substring(0, breadcrums.lastIndexOf(' . '))
          }

				}
				html = html.replace(/,<\/li>$/gim, '</li>');
				html += '</ul>';
				html += '}';
				return html;
			};
			var html = '';
      var breadcrums = 'context';
			function parse (val) {
				var data = null;
				if (!angular.isObject(val)) {
					try {
						data = JSON.parse(val);
					} catch (e) {
						data = {'error': 'invalid json'};
						return;
					}
				} else {
					data = val;
				}
				if (isArray(data)) {
					if (scope.sortBy) {
						data = data.sort(function (a,b) {
							var sort = scope.sortBy.split(':');
							var field = sort[0];
							var order = sort[1];
							var aField = a[field];
							var bField = b[field];
							var orderByNumber = function (n1, n2) {
								return n1 - n2;
							};
              var orderByLength = function (s1, s2) {
								return s1.length - s2.length;
							};
              var orderByString = function (s1, s2) {
								return s1.localeCompare(s2);
							};
							var method = null;
							if (typeof aField == 'number' && typeof bField == 'number') {
								method = orderByNumber;
							} else if (typeof aField === 'string' && typeof bField === 'string') {
								method = orderByString;

							} else if (aField.hasOwnProperty('length') && bField.hasOwnProperty('length')) {
								method = orderByLength;

							} else {
								return;
							}
							if (order == 'asc') {
								return method(aField, bField);
							} else if (order == 'desc') {
								return method(bField, aField);
							}
							return method(aField, bField);
						});
					}
				}
				if (isArray(data)) {
					html = '[<ul class="array">';
				} else if (isObject(data)) {
					html = '{<ul class="object">';
				}
//				for (var item in data) {
        var keys = [];
        for (let key in data) keys.push(key);
        keys.sort();

        for (let j = 0; j < keys.length; j++) {
          let item = keys[j];
					var key = item;
					var value = data[item];

          var validatorResult = unquotedValidator(item)
          if (validatorResult.needsBrackets) {
            breadcrums = breadcrums + '[\'' + item + '\']'
          } else {
            breadcrums = breadcrums + ' . ' + item
          }

					if (isRaw(value)) {
						html += '<li>' + parseRaw(key, value) + ',</li>';
					} else if (isArray(value)) {
						html += '<li>' + parseArray(key, value) + ',</li>';
					} else if (isObject(value)) {
						html += '<li>' + parseObject(key, value) + ',</li>';
					}

          if (validatorResult.needsBrackets) {
            breadcrums = breadcrums.substring(0, breadcrums.lastIndexOf('['))
          } else {
            breadcrums = breadcrums.substring(0, breadcrums.lastIndexOf(' . '))
          }

				}
				html = html.replace(/,<\/li>$/gim, '</li>');
				if (isArray(data)) {
					html += '</ul>]';
				} else if (isObject(data)) {
					html += '</ul>}';
				}
				elem.html('<div class="angular-json-explorer">' + html + '</div>');
				var collections = elem[0].getElementsByTagName('a');
				for (var i = 0; i < collections.length; i++) {
					var collectionItem = collections[i];
					angular
					.element(collectionItem)
					.on('click', function (e) {
						e.preventDefault();
						var el = angular.element(this).parent().next();
						var d = angular.element(this).parent().next().next();
						if (this.innerHTML == '+') {
							el.addClass('hidden');
							d.removeClass('hidden');
							this.innerHTML = '-';
						} else {
							el.removeClass('hidden');
							d.addClass('hidden');
							this.innerHTML = '+';
						}
					});
				}
			}

			scope.$watch('url', function (val) {

        function contexterToJsTree (rootName, rootNode) {
          var nodes = {'core': {'data': [{
            text: rootName,
            icon: 'jstree-folder',
            children: []
          }]}}

          function getChildren(current, levelChildren) {
            Object.keys(current).forEach(key => {
              var val = current[key]
              if (val && val.path && val.path.base) {
                // its a file
                levelChildren.push({
                  text: val.path.base,
                  icon: 'jstree-file'
                })
              } else {
                // its a dir
                levelChildren.push({
                  text: key,
                  icon: 'jstree-folder',
                  children: getChildren(current[key],[])
                })
              }
            })
            return levelChildren
          }

          nodes.core.data[0].children = getChildren(rootNode, [])
          return nodes
        }

				if (val) {
					var http;
					if (angular.isString(val)) {
						 http = $http.get(val);
					} else {
						http = $http(val);
					}
					http
					.success(function (response) {
						scope.requestData = response;
            context = response
            var root = Object.keys(context).find(key => {
//              root = key
              return !(context[key] instanceof Array)
            })
            $('#dir').jstree(contexterToJsTree(root, context[root]));
					});
				}
			});

			scope.$watch('[data, jsonData]', function (v) {
				if (v[0]) {
					parse(v[0]);
					return;
				}
				if (v[1]) {
					parse(v[1]);
					return;
				}
			}, true);

			scope.$watch('requestData', function (val) {
				if (val) {
					parse(val);
				}
			});
			scope.$watch('collapsed', function (val) {
				if (val != undefined) {
					var collections = elem[0].getElementsByTagName('a');
					for (var i = 0; i < collections.length; i++) {
						var collectionItem = collections[i];
						var el = angular.element(collectionItem).parent().next();
						var d = angular.element(collectionItem).parent().next().next();
						if (val == true) {
							if (collectionItem.innerHTML == '-') {
								el.removeClass('hidden');
								d.addClass('hidden');
								collectionItem.innerHTML = '+';
							}
						} else {
							if (collectionItem.innerHTML == '+') {
								el.addClass('hidden');
								d.removeClass('hidden');
								collectionItem.innerHTML = '-';
							}
						}
					}
				}
			});
		}
	};
}]);
