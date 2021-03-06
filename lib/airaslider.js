;(function (root, factory) {
  'use strict'
  /* istanbul ignore next */
  if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
      value: function (predicate) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = o.length >>> 0;
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }
        var thisArg = arguments[1];
        var k = 0;
        while (k < len) {
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return k;
          }
          k++;
        }
        return -1;
      },
      configurable: true,
      writable: true
    });
  }
  if (typeof define === 'function' && define.amd) {
    define(['angular'], factory)
  } else if (typeof module === 'object' && module.exports) {
    var angularObj = angular || require('angular')
    if ((!angularObj || !angularObj.module) && typeof angular != 'undefined') {
      angularObj = angular
    }
    module.exports = factory(angularObj)
  } else {
    factory(root.angular)
  }
})(this, function (angular) {
  var module = angular.module('airsliderModule', []).factory('airRzSliderOptions', function () {
    var defaultOptions = {
      // 外圆开始和结束角度
      innerCircleStartAngle: 225,
      innerCircleEndAngle: 135,
      innerRad: 270, // 内圆总度数
      color: '#03a9f4',
      radius: 73
    }
    var factory = {}
    factory.getOptions = function (options, minVal, maxVal) {
      var container = document.getElementById('container')
      var containerWidth = container.clientWidth
        || container.parentNode.clientWidth;
      var containerHeight = container.clientHeight
        || container.parentNode.clientHeight;
      var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth
        || 0);
      var windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight
        || 0);
      var width = containerWidth < windowWidth ? containerWidth : windowWidth;
      var height = containerHeight < windowHeight ? containerHeight : windowHeight;
      var drawWidth = width
      var drawHeight = height
      var innerRad = defaultOptions.innerRad // 内圆总度数
      var min = minVal
      var max = maxVal
      var minIndex = options.stepArray.findIndex(function (v) {
        return v == min
      })
      var maxIndex = options.stepArray.findIndex(function (v) {
        return v == max
      })
      var cminVal = options.stepArray[minIndex]
      var cmaxVal = options.stepArray[maxIndex]
      var minstartAngle = (225 + (innerRad / options.stepArray.length) * (minIndex)) // 改动
      var maxstartAngle = (225 + (innerRad / options.stepArray.length) * (maxIndex + 1))
      var startAngle = Math.floor(minstartAngle >= 360 ? minstartAngle - 360
        : minstartAngle);  // start deg
      var endAngle = Math.floor(maxstartAngle <= 360 ? maxstartAngle : maxstartAngle - 360)
      var globalOptions = {
        cx: drawWidth / 2,
        cy: drawHeight / 2,
        minIndex: minIndex,
        maxIndex: maxIndex,
        cminVal: cminVal,
        cmaxVal: cmaxVal,
        minstartAngle: minstartAngle,
        maxstartAngle: maxstartAngle,
        startAngle: startAngle,
        endAngle: endAngle
      }
      return angular.extend({}, defaultOptions, globalOptions, options)
    }
    return factory
  }).factory('SVGElement', function () {
    function SVGElement(type, options) {
      this.create = function (type) {
        this.elem = document.createElementNS('http://www.w3.org/2000/svg', type);
      };
      this.get = function (key) {
        return this.elem.getAttributeNS(null, key);
      };
      this.set = function (key, val) {
        this.elem.setAttributeNS(null, key, val);
      };
      this.pathTap = function (moveclaabackStart, movecallBack, endcallBack) {
        var myTapStart = 0,
          myTapEnd = 0,
          timeTap = 300;
        this.addEventListener("touchstart", function (e) {
          e.preventDefault();
          e.stopPropagation()
          myTapStart = e.timeStamp;
          var point = e.changedTouches[0];
          this.strX = point.pageX;
          this.strY = point.pageY;
          this.isMove = false;
          moveclaabackStart(e)
        }, false);
        this.addEventListener("touchmove", function (e) {
          e.preventDefault();
          e.stopPropagation()
          var point = e.changedTouches[0];
          var changeX = point.pageX - this.strX;
          var changeY = point.pageY - this.strY;
          if (Math.abs(changeX) > 10 || Math.abs(changeY) > 10) {
            this.isMove = true;
            movecallBack(e)
          }
        }, false);
        this.addEventListener("touchend", function (e) {
          e.preventDefault();
          e.stopPropagation()
          myTapEnd = e.timeStamp;
          timeTap = myTapEnd - myTapStart;
          endcallBack(e);
          // if (this.isMove) {
          // }
        }, false);
      };
      this.setBulk = function (options) {
        for (var key in options) {
          if (options.hasOwnProperty(key)) {
            this.set(key, options[key]);
          }
        }
      };
      this.addClass = function (cls) {
        this.elem.classList.add(cls);
      };
      this.removeClass = function (cls) {
        this.elem.classList.remove(cls);
      };
      this.addEventListener = function (type, func) {
        this.elem.addEventListener(type, func);
      };
      this.removeEventListener = function (type, func) {
        this.elem.removeEventListener(type, func);
      };
      this.appendChild = function (child) {
        this.elem.appendChild(child);
      };
      this.removeChild = function (child) {
        this.elem.removeChild(child);
      };
      this.element = function () {
        return this.elem;
      };
      this.create(type);
      if (options !== null) {
        this.setBulk(options);
      }
    }

    return SVGElement
  }).factory('airRzSlider', function (airRzSliderOptions,
    SVGElement) {
    var slider = function (scope) {
      this.scope = scope
      this.container = document.getElementById('container')
      this.init()
    }
    slider.prototype = {
      init: function () {
        var self = this
        self.applyOptions()
        self.createDom()
        this.createDrawDom()
        var startPos = this.polarToCartesian(this.options.endAngle)
        self.updateData(startPos.x, startPos.y)
        self.createEvent()
        this.move = false
        this.start = false
        this.scope.$watch('rzSliderModel', function (newValue, oldValue) {
          if (newValue === oldValue && !self.move) {
            return
          }
          // self.applyOptions()
          self.view2model()
          self.changView(self.options)
          self.createDrawDom()
        })
        this.scope.$watch('rzSliderHigh', function (newValue, oldValue) {
          if (newValue === oldValue) {
            return
          }
          self.view2model()
          self.changView(self.options)
          self.createDrawDom()
        })
        this.scope.$watch('disabled', function (newValue, oldValue) {
          if (newValue === oldValue) {
            return
          }
          if (!self.scope.disabled) {
            self.createEvent()
            self.view2model()
            self.changView(self.options)
            self.createDrawDom()
          }
        })
      },
      applyOptions: function () {
        var sliderOptions
        if (this.scope.rzSliderOptions) {
          sliderOptions = this.scope.rzSliderOptions()
        } else {
          sliderOptions = {}
        }
        var minVal = this.scope.rzSliderModel
        var maxVal = this.scope.rzSliderHigh
        this.options = airRzSliderOptions.getOptions(sliderOptions, minVal, maxVal)
        this.options.minValue = minVal
        this.options.maxValue = maxVal
        this.options.disabled = this.scope.disabled
        this.options.minPos = this.polarToCartesian(this.options.innerCircleStartAngle);
        this.options.maxPos = this.polarToCartesian(this.options.innerCircleEndAngle);
        this.lock = null
        this.isLeft = false
        this.isRight = false
        this.oldX = this.options.cx;
        this.oldY = this.options.cy
        this.oldOffset = this.options.startAngle;
        this.options.posMap = {}
      },
      findBin: function (ex, ey) {
        var bins = this.options.stepArray
        var innerCircleStartAngle = this.options.innerCircleStartAngle
        var innerCircleEndAngle = this.options.innerCircleEndAngle
        var cx = this.options.cx
        var cy = this.options.cy
        var cmaxVal = this.options.cmaxVal
        var cminVal = this.options.cminVal
        var stepArray = this.options.stepArray
        var minIndex = this.options.minIndex
        var x = this.getAngle(cx, cy, ex, ey)
        var evey = this.options.innerRad / bins.length
        // 角度x 在 开始角度和360度之间,
        // 数字 107
        // 能被整除是false
        var index
        if (innerCircleStartAngle <= x && x <= 360) {
          var d = (x - innerCircleStartAngle)
          var num = d % evey ? Math.floor(d / evey) + 1 : (d / evey) - 1
          if (num == Math.floor(d / evey) + 1) {
            index = num - 1
          } else {
            index = num
          }
        } else if (0 <= x && x <= innerCircleEndAngle) {
          var d = (x + (360 - innerCircleStartAngle))
          index = d % evey ? Math.floor((d / evey)) : Math.floor(d / evey)
        }
        if (!!this.lock && this.lock.flag) {
          cmaxVal = bins[index]
        } else if (!!this.lock && !this.lock.flag) {
          cminVal = bins[index]
        }

        if (cminVal == undefined) {
          cminVal = stepArray[0]

        } else if (cmaxVal == undefined) {
          cmaxVal = stepArray[bins.length - 1]
        }
        if (Math.abs(this.options.posMap.edAng - this.options.posMap.sxAng) == 1) {
          if (!!this.lock && this.lock.flag) {
            cmaxVal = cminVal
          } else if (!!this.lock && !this.lock.flag) {
            cminVal = cmaxVal
          }
        }
        cmaxVal = cmaxVal <= cminVal ? cminVal : cmaxVal
        if (bins[0] == cminVal && cmaxVal == bins[bins.length - 1] && Math.abs(this.options.posMap.sxAng - this.options.posMap.edAng) < 10) {
          cminVal = cmaxVal
        }
        this.options.cmaxVal = cmaxVal
        this.options.cminVal = cminVal
        return cminVal + " -  " + cmaxVal
      },
      createDom: function () {
        var innerCircleStartAngle = this.options.innerCircleStartAngle
        var innerCircleEndAngle = this.options.innerCircleEndAngle
        var cx = this.options.cx
        var cy = this.options.cy
        var radius = this.options.radius
        var endAngle = this.options.endAngle
        var startAngle = this.options.startAngle
        var minPos = this.options.minPos
        var maxPos = this.options.maxPos
        var container = this.container
        this.innerCircle = new SVGElement('path', {
          'cx': cx,
          'cy': cy,
          'r': radius,
          'fill': 'none',
          'stroke-linecap': 'round',
          'stroke': '#D2D2D2',
          'stroke-width': 26,
          'stroke-dashoffset': '0',
          'd': this.describeOutArc(innerCircleStartAngle + 2, innerCircleEndAngle - 2)
        });
        container.appendChild(this.innerCircle.element());
        var startPos = this.polarToCartesian(endAngle);
        var endPos = this.polarToCartesian(startAngle)
        this.outerCircle = new SVGElement('path', {
          'id': 'outerCircle',
          'fill': 'none',
          'stroke': this.options.color,
          'stroke-width': 22,
          'd': this.describeArc(startAngle, endAngle)
        });
        container.appendChild(this.outerCircle.element());
        this.handler1 = new SVGElement('circle', {
          'id': 'circle1',
          'cx': endPos['x'],
          'cy': endPos['y'],
          'z-index': '2',
          'r': 16,
          'fill': 'url(#minText)'
        });
        container.appendChild(this.handler1.element());
        this.handler = new SVGElement('circle', {
          'id': 'circle',
          'cx': startPos['x'],
          'cy': startPos['y'],
          'r': 16,
          'fill': 'url(#maxText)'
        });
        container.appendChild(this.handler.element());
        var placeholder = container.getElementById('dataPlaceholder');
        if (placeholder === null) {
          placeholder = new SVGElement('g', {
            'id': 'dataPlaceholder',
          }).element();
          container.appendChild(placeholder);
        }
        var fontFlag = this.options.ftext.indexOf('风量')
        var ftext = new SVGElement('text', {
          'x': fontFlag ? 48 : 70,
          'y': 85,
          'fill': '#01B1EC',
          'font-size': '12px',
          'font-family': 'Verdana'
        });
        this.mintext = new SVGElement('text', {
          'x': minPos['x'] - 35,
          'y': minPos['y'] + 10,
          'fill': '#D2D2D2',
          'font-size': '12px',
          'font-family': 'Verdana'
        })
        this.maxtext = new SVGElement('text', {
          'x': maxPos['x'] + 25,
          'y': maxPos['y'] + 10,
          'fill': '#D2D2D2',
          'font-size': '12px',
          'font-family': 'Verdana'
        })
        ftext.element().textContent = this.options.ftext + '(m³/h)'
        this.maxtext.element().textContent = this.options.stepArray[this.options.stepArray.length
        - 1]
        this.mintext.element().textContent = this.options.stepArray[0]
        placeholder.appendChild(this.mintext.element())
        placeholder.appendChild(this.maxtext.element())
        placeholder.appendChild(ftext.element())
        this.text = new SVGElement('text', {
          'x': 66,
          'y': 110,
          'fill': '#01B1EC',
          'font-size': '16px',
          'textLength': '70',
          'font-family': 'Verdana'
        });
        placeholder.appendChild(this.text.element());
        this.touchText = new SVGElement('text', {
          'x': 10,
          'y': 10,
          'fill': '#03a9f4',
          'font-size': '11px',
          'font-family': 'Verdana',
          'opacity': 1
        });
        placeholder.appendChild(this.touchText.element());
      },
      insertAfter: function (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
      },
      updateDrawDom: function (x1, y1, x2, y2) {
        this.circlone1.set('cx', x1)
        this.circlone1.set('cy', y1)
        this.fmin.set('x', x1 - 10)
        this.fmin.set('y', y1 + 4)
        this.circlone.set('cx', x2)
        this.circlone.set('cy', y2)
        this.fmax.set('x', x2 - 10)
        this.fmax.set('y', y2 + 4)
      },
      hideDrawDom: function () {
        this.circlone1.set('opacity', 0)
        this.fmin.set('opacity', 0)
        this.circlone.set('opacity', 0)
        this.fmax.set('opacity', 0)
      },
      createDrawDom: function () {
        var x1 = Math.floor(this.handler1.get('cx'))
        var y1 = Math.floor(this.handler1.get('cy'))
        var x2 = Math.floor(this.handler.get('cx'))
        var y2 = Math.floor(this.handler.get('cy'))
        if (this.circlone == undefined) {
          this.circlone1 = new SVGElement('circle', {
            'id': 'circle1',
            'cx': x1,
            'cy': y1,
            'opacity': 0,
            'r': 12,
            'fill': '#01B1EC',
            'stroke': '#fff',
            'stroke-width': 2,
          });
          this.circlone = new SVGElement('circle', {
            'id': 'circle',
            'cx': x2,
            'cy': y2,
            'opacity': 0,
            'r': 12,
            'fill': '#01B1EC',
            'stroke': '#fff',
            'stroke-width': 2,
          });
          this.fmin = new SVGElement('text', {
            'x': x1 - 10,
            'y': y1 + 4,
            'opacity': 0,
            'fill': '#fff',
            'font-size': '10px',
            'font-family': 'Verdana'
          });
          this.fmax = new SVGElement('text', {
            'x': x2 - 10,
            'y': y2 + 4,
            'fill': '#fff',
            'opacity': 0,
            'font-size': '10px',
            'font-family': 'Verdana'
          });
          this.fmax.element().textContent = 'Max'
          this.fmin.element().textContent = 'Min'
          var refNode = document.getElementById('outerCircle')
          this.insertAfter(this.fmin.element(), refNode)
          this.insertAfter(this.fmax.element(), refNode)
          this.insertAfter(this.circlone.element(), refNode)
          this.insertAfter(this.circlone1.element(), refNode)
        } else {
          this.circlone.set('opacity', 1)
          this.circlone.set('opacity', 1)
          this.fmax.set('opacity', 1)
          this.fmax.set('opacity', 1)
          this.updateDrawDom(x1, y1, x2, y2)
        }
        this.circlone1.set('opacity', 1)
        this.circlone1.set('opacity', 1)
        this.fmin.set('opacity', 1)
        this.fmin.set('opacity', 1)
        this.circlone.set('opacity', 1)
        this.circlone.set('opacity', 1)
        this.fmax.set('opacity', 1)
        this.fmax.set('opacity', 1)
      },
      createEvent: function () {
        this.outerCircle.pathTap(this.clickStar.bind(this), this.clickInit.bind(this), this.clickEnd.bind(this))
        this.innerCircle.pathTap(this.clickStar.bind(this), this.clickInit.bind(this), this.clickEnd.bind(this))
        this.handler.addEventListener('touchstart', this.touchstart.bind(this));
        this.handler1.addEventListener('touchstart', this.touchstart.bind(this));
      },
      clickStar: function (event) {
        if (this.scope.disabled) {
          return false
        }
        var container = document.getElementById('container')
        var sTop = document.documentElement.scrollTop || document.body.scrollTop;
        var y = container.getBoundingClientRect().top + sTop
        var x = container.getBoundingClientRect().left
        var point = event.changedTouches[0]
        var flag = true
        this.lock = {}
        this.lock.target = flag ? this.handler : this.handler1
        this.lock.flag = flag
        var cx = this.options.cx
        var cy = this.options.cy
        this.resultData = this.initHandleData(point.pageX - x, point.pageY - y);
        var pontAng = this.getAngle(cx, cy, this.resultData.newX, this.resultData.newY)
        var startx = this.handler1.get('cx')
        var starty = this.handler1.get('cy')
        var endx = this.handler.get('cx')
        var endy = this.handler.get('cy')
        var sxAng = this.getAngle(cx, cy, startx, starty) // min
        var edAng = this.getAngle(cx, cy, endx, endy) // max
        if (edAng >= sxAng && pontAng >= sxAng && pontAng <= edAng) {
          // 不同象限
          this.lock.flag = pontAng - sxAng > edAng - pontAng
          //this.clickHandle(result)
          // return false
        } else if (pontAng >= 0 && pontAng <= edAng && (sxAng >= 180 && sxAng <= 360) && (0 <= edAng
            && edAng <= 180)) {
          // pontAng 在 右侧
          this.lock.flag = edAng - pontAng <= 360 - sxAng + pontAng
          //this.clickHandle(result)
          // return false
        } else if (sxAng <= pontAng && pontAng <= 360 && (sxAng >= 180 && sxAng <= 360) && (0
            <= edAng && edAng <= 180)) {
          // pontAng 在 左侧
          this.lock.flag = pontAng - sxAng > 360 - pontAng + edAng
          //this.clickHandle(result)
          // return false
        }
        var edR = edAng >= this.options.innerCircleStartAngle && edAng <= 360 && edAng >= 180
        var stR = sxAng >= this.options.innerCircleStartAngle && sxAng <= 360 && sxAng >= 180
        var edL = edAng <= this.options.innerCircleEndAngle && edAng >= 0
        var stL = sxAng <= this.options.innerCircleEndAngle && sxAng >= 0
        if (edR && stR) {
          if (pontAng >= this.options.innerCircleStartAngle && pontAng <= sxAng
            || pontAng >= 180 && pontAng <= sxAng && pontAng <= 360
          ) {
            this.lock.flag = false
          }
        } else if (edL && stL) {
          if (pontAng >= 0 && pontAng <= sxAng || pontAng >= 180 && pontAng <= 360) {
            this.lock.flag = false
          }
        } else if (stR && edL) {
          if (pontAng >= this.options.innerCircleStartAngle && pontAng <= 360
            || (pontAng <= this.options.innerCircleStartAngle) && pontAng >= 180 && pontAng <= 360
          ) {
            this.lock.flag = false
          }
        }
        this.lock.target = this.lock.flag ? this.handler : this.handler1
        this.resultData = this.initHandleData(point.pageX - x, point.pageY - y)
        var posMap = this.options.posMap
        if ((posMap.sxAng >=180 && posMap.sxAng <= 360) && (posMap.edAng >= 180 && posMap.edAng <= 360) && posMap.edAng <= posMap.sxAng
          // || (posMap.sxAng >=0 && this.lock.flag && this.edAng >= 180) && (posMap.edAng >= 0 && posMap.edAng <= this.options.innerCircleStartAngle + 4) && posMap.edAng >= 180 && posMap.edAng <=360
          || (posMap.sxAng >=0 && posMap.sxAng <= 180) && (posMap.edAng >= 0 && posMap.edAng <= this.options.innerCircleStartAngle + 4) && posMap.edAng >= 180 && posMap.edAng <=360
          || (this.lock.flag && this.options.cminVal == this.options.cmaxVal && this.options.cminVal == this.options.stepArray[this.options.stepArray.length - 1])) {
          this.resultData.element = this.handler1
          var result = this.resultData
          this.lock.flag = false
          this.setHandlerPosition(this.handler1, result.newX, result.newY);
          this.updateData(result.newX, result.newY);
          var pathStr = this.setPathPosition(result.newX, result.newY)
          this.setCircleOffset(pathStr);
          this.updateModel()
          this.hideDrawDom()
          return false
        }

        this.clickHandle(this.resultData)
      },
      clickEnd: function (event) {
        if (this.scope.disable) {
          return false
        }
        var x1 = Math.floor(this.handler1.get('cx'))
        var y1 = Math.floor(this.handler1.get('cy'))
        var x2 = Math.floor(this.handler.get('cx'))
        var y2 = Math.floor(this.handler.get('cy'))
        this.updateDrawDom(x1, y1, x2, y2)
        this.fmin.set('opacity', 1)
        this.fmax.set('opacity', 1)
        this.touchText.set('opacity', 0)
      },
      clickInit: function (event) {

        if (this.scope.disable || this.options.disabled) {
          return false
        }
        var container = document.getElementById('container')
        var sTop = document.documentElement.scrollTop || document.body.scrollTop;
        var y = container.getBoundingClientRect().top + sTop
        var x = container.getBoundingClientRect().left
        var point = event.changedTouches[0]
        var resultData = this.initHandleData(point.pageX - x, point.pageY - y);
        resultData.element = this.lock.flag ? this.handler : this.handler1
        if (!resultData.disable && (!this.options.disabled || !this.scope.disabled)) {
          this.showTouchText()
          this.clickHandle(resultData)
        }
      },
      clickHandle: function (result) {
        this.setHandlerPosition(result.element, result.newX, result.newY);
        this.updateData(result.newX, result.newY);
        this.setCircleOffset(result.pathStr);
        this.updateModel()
        this.hideDrawDom()
      },
      eventInit: function () {
        this.lock = {}
        var flag = event.srcElement.id == 'circle'
        this.lock.target = flag ? this.handler : this.handler1
        this.lock.flag = flag
        if (flag) {
          this.handler1.removeEventListener('mousemove', this.mousemove.bind(this))
          this.handler1.removeEventListener('mouseup', this.mouseup.bind(this))
        } else {
          this.handler.removeEventListener('mousemove', this.mousemove.bind(this))
          this.handler.removeEventListener('mouseup', this.mouseup.bind(this))
        }
      },
      mousedown: function (event) {
        this.eventInit()
        event.preventDefault();
        event.stopPropagation()
        var container = document.getElementById('container');
        if (this.circlone !== undefined) {
          this.hideDrawDom()
        }
        container.addEventListener('mousemove', this.mousemove.bind(this));
        container.addEventListener('mouseup', this.mouseup.bind(this));
      },
      touchstart: function (event) {
        this.start = true
        this.eventInit()
        event.preventDefault();
        event.stopPropagation()
        var container = document.getElementById('container');
        if (this.circlone !== undefined) {
          this.hideDrawDom()
        }

        container.addEventListener('touchmove', this.touchmove.bind(this));
        container.addEventListener('touchend', this.touchend.bind(this));
      },
      mousemove: function (event) {
        event.preventDefault();
        event.stopPropagation()
        if (this.options.disabled) {
          var container = document.getElementById('container')
          var x = container.getBoundingClientRect().left
          var sTop = document.documentElement.scrollTop || document.body.scrollTop;
          var y = container.getBoundingClientRect().top + sTop
          this.moveHandler(event.clientX - x, event.clientY - y);
        }
      },
      touchmove: function (event) {
        // Ignore multi-touch
        if (!this.start) {
          return false
        }
        if (event.touches.length > 1) {
          return;
        }
        if (this.circlone !== undefined) {
          this.hideDrawDom()
        }
        event.preventDefault();
        event.stopPropagation()
        var container = document.getElementById('container')
        var sTop = document.documentElement.scrollTop || document.body.scrollTop;
        var y = container.getBoundingClientRect().top + sTop
        var x = container.getBoundingClientRect().left
        this.moveHandler(event.touches[0].pageX - x, event.touches[0].pageY - y);
      },
      mouseup: function (event) {
        event.preventDefault();
        event.stopPropagation()
        window.removeEventListener('mousemove', this.mousemove);
        window.removeEventListener('mouseup', this.mouseup);
      },
      touchend: function (event) {
        this.start = false
        event.preventDefault();
        event.stopPropagation()
        this.createDrawDom()
        this.touchText.set('opacity', 0)
        window.removeEventListener('touchmove', this.touchmove);
        window.removeEventListener('touchend', this.touchend);
      },
      initHandleData: function (x, y) {
        this.move = true
        // calculate new handler position
        var minOffset = 225; // 最小值
        var maxOffset = 125; //最大值
        var disable = false
        var lock = this.lock
        var posMap = this.options.posMap
        var cx = this.options.cx
        var cy = this.options.cy
        var radius = this.options.radius
        var minPos = this.options.minPos
        var maxPos = this.options.maxPos
        var stepArray = this.options.stepArray
        var dx = x - cx;
        var dy = y - cy;
        var scale = radius / Math.hypot(dx, dy);
        var newX = dx * scale + cx;
        var newY = dy * scale + cy;
        var offset;
        // handler is locked at min or max position
        var fi = Math.atan(dx / -dy);
        if (y >= cy) {
          fi += Math.PI;
        } else if (x <= cx && y <= cy) {
          fi += 2 * Math.PI;
        }
        offset = this.radiansToDegress(fi);
        // save current x coordinate
        this.oldY = newY
        this.oldX = newX;
        // save current offset
        this.oldOffset = offset;
        // set new handler circle position
        var element = this.lock.target
        var pathStr = this.setPathPosition(newX, newY)
        if (!this.lock.flag && this.options.cminVal !== stepArray[0] && this.options.cminVal
          !== this.options.cmaxVal) {
          this.swapElements(this.handler.element(), this.handler1.element())
        } else if (this.lock.flag && this.options.cmaxVal !== stepArray[stepArray.length - 1]
          && this.options.cminVal !== this.options.cmaxVal) {
          this.swapElements(this.handler1.element(), this.handler.element())
        }
        if (!!posMap.sxAng && posMap.sxAng == posMap.edAng
          // && Math.abs(posMap.sxAng - posMap.edAng) <= 0.1
          || (posMap.startx >= cx && posMap.sxAng >= posMap.edAng)
          || posMap.startx >= cx && (posMap.endx <= cx) && posMap.edAng
          >= this.options.innerCircleEndAngle
          || posMap.endx >= cx && posMap.edAng >= (this.options.innerCircleEndAngle + 4)
          || newX > minPos.x && newY > minPos.y && !lock.flag
          || (posMap.sxAng >=180 && posMap.sxAng <= 360) && (posMap.edAng >= 180 && posMap.edAng <= 360) && posMap.edAng <= posMap.sxAng
          || (posMap.sxAng >=0 && posMap.sxAng <= 180) && posMap.edAng >= 180
          || (posMap.startx <= cx && posMap.sxAng >= posMap.edAng) && (posMap.edAng >= 180
            && posMap.edAng <= 360) && posMap.sxAng >= posMap.edAng
        ) {
          disable = true
        } else {
          disable = false
        }
        return {
          pathStr: pathStr,
          newX: newX,
          newY: newY,
          element: element,
          disable: disable
        }
      },

      showTouchText: function () {
        if (this.options.ftext.indexOf('风量') == -1) {
          this.touchText.element().textContent = this.lock.flag ? 'Max：' + this.options.cmaxVal
            : 'Min：' + this.options.cminVal
        } else {
          this.touchText.element().textContent = this.lock.flag ? '最大风量：' + this.options.cmaxVal
            : '最小风量：' + this.options.cminVal
        }
        this.touchText.set('opacity', 1)
      },
      moveHandler: function (x, y) {
        if (this.lock.flag && this.options.cminVal == this.options.cmaxVal && this.options.cminVal == this.options.stepArray[this.options.stepArray.length - 1]) {
          return false
        }
        var result = this.initHandleData(x, y);
        if (!result.disable && !this.scope.disabled) {
          this.setHandlerPosition(result.element, result.newX, result.newY);
          this.updateData(result.newX, result.newY);
          this.setCircleOffset(result.pathStr);
          this.showTouchText()
          this.updateModel()
        }
      },
      updateModel: function () {
        this.scope.rzSliderModel = this.options.cminVal
        this.scope.rzSliderHigh = this.options.cmaxVal
        this.scope.$apply()
      },
      view2model: function (self) {
        this.options.cminVal = this.scope.rzSliderModel
        this.options.cmaxVal = this.scope.rzSliderHigh
        this.options.disabled = this.scope.disabled
        this.options['minValue'] = this.scope.rzSliderModel
        this.options['maxValue'] = this.scope.rzSliderHigh
      },
      changView: function (options) {
        var min = options['minValue']
        var max = options['maxValue']
        var minIndex = options.stepArray.findIndex(function (v) {
          return v == min
        });
        var maxIndex = options.stepArray.findIndex(function (v) {
          return v == max
        });
        var innerRad = options.innerRad
        var stepArray = options.stepArray
        var minstartAngle = (225 + (innerRad / options.stepArray.length) * (minIndex)) // 改动
        var maxstartAngle = (225 + (innerRad / options.stepArray.length) * (maxIndex + 1))
        var startAngle = Math.floor(minstartAngle >= 360 ? minstartAngle - 360
          : minstartAngle);  // start deg
        var endAngle = Math.floor(maxstartAngle <= 360 ? maxstartAngle : maxstartAngle - 360)
        var start = this.polarToCartesian(endAngle);
        var end = this.polarToCartesian(startAngle);
        if (this.options.cminVal == stepArray[0] && this.options.cminVal == this.options.cmaxVal) {
          this.swapElements(this.handler1.element(), this.handler.element())
        } else if (this.options.cmaxVal == stepArray[stepArray.length - 1] && this.options.cminVal
          == this.options.cmaxVal) {
          this.swapElements(this.handler.element(), this.handler1.element())
        }
        var posMap = this.options.posMap

        if (this.lock == null) {
          if (!this.scope.disabled) {
            return false
          }
          this.setHandlerPosition(this.handler, start.x, start.y)
          this.setHandlerPosition(this.handler1, end.x, end.y)
          var dstr = this.describeArc(startAngle, endAngle)
          this.setCircleOffset(dstr)
          this.text.element().textContent = this.options.cminVal + " -  " + this.options.cmaxVal
          return false
        }
        if (this.lock.flag) {
          this.setHandlerPosition(this.handler, start.x, start.y)
          this.setHandlerPosition(this.handler1, end.x, end.y)

          // this.setHandlerPosition(this.handler1, posMap.startx, posMap.starty)
        }else {
          this.setHandlerPosition(this.handler, start.x, start.y)
          // this.setHandlerPosition(this.handler, posMap.endx, posMap.endy)
          this.setHandlerPosition(this.handler1, end.x, end.y)
        }
        var dstr = this.describeArc(startAngle, endAngle)
        this.setCircleOffset(dstr)
        this.text.element().textContent = this.options.cminVal + " -  " + this.options.cmaxVal
      },
      setHandlerPosition: function (element, centerX, centerY) {
        element.set('cx', centerX);
        element.set('cy', centerY);
      },
      setPathPosition: function (x, y) {
        var endAngle = this.options.endAngle
        var startAngle = this.options.startAngle
        var start = this.polarToCartesian(endAngle);
        var end = this.polarToCartesian(startAngle);
        var lock = this.lock
        var cx = this.options.cx
        var cy = this.options.cy
        var radius = this.options.radius
        var posMap = this.options.posMap
        // handle1 setting  start里取
        var dstr = ''
        if (lock.flag) {
          posMap.endx = x
          posMap.endy = y
          var ox = this.handler1.get('cx')
          var oy = this.handler1.get('cy')
          posMap.startx = ox
          posMap.starty = oy
          var sxAng = this.getAngle(cx, cy, posMap.startx, posMap.starty)
          var edAng = this.getAngle(cx, cy, posMap.endx, posMap.endy)
          posMap.edAng = edAng
          posMap.sxAng = sxAng
          var flag = sxAng - edAng <= 180 && edAng >= 0 && edAng <= 180 && sxAng >= 180
            && sxAng <= 360
          dstr = [
            "M", x, y,
            "A", radius, radius, 0, flag ? 1 : 0, 0, posMap.startx, posMap.starty,
          ].join(" ")
        } else {
          posMap.startx = x
          posMap.starty = y
          var ox = this.handler.get('cx')
          var oy = this.handler.get('cy')
          posMap.endx = ox
          posMap.endy = oy
          var sxAng = this.getAngle(cx, cy, posMap.startx, posMap.starty)
          var edAng = this.getAngle(cx, cy, posMap.endx, posMap.endy)
          posMap.edAng = edAng
          posMap.sxAng = sxAng
          var flag = sxAng - edAng >= 180
          if (sxAng >= 180 && sxAng <= 360 && edAng >= 180 && edAng <= 360
            || sxAng >= 0 && sxAng <= 180 && edAng >= 0 && edAng <= 180) {
            flag = true
          }
          dstr = [
            "M", x, y,
            "A", radius, radius, 0, flag ? 0 : 1, 1, posMap.endx, posMap.endy,
          ].join(" ")
        }
        return dstr
      },
      setCircleOffset: function (dstr) {
        this.outerCircle.set(
          'd', dstr
        );
      },
      updateData: function (ex, ey) {
        this.text.element().textContent = this.findBin(ex, ey)
      },
      swapElements: function (a, b) {
        var parent = a.parentNode
        return parent.insertBefore(a, b);
      },
      getAngle: function (cx, cy, x2, y2) {
        var x = Math.abs(cx - x2);
        var y = Math.abs(cy - y2);
        var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var tan = x / y;
        var radina = Math.atan(tan);//用反三角函数求弧度
        var angle = Math.ceil(180 / (Math.PI / radina)) || 0;//将弧度转换成角度
        if (x2 > cx && y2 > cy) {// point在第四象限 完
          angle = 180 - angle;
        }
        if (x2 == cx && y2 > cy) {// point在y轴负方向上
          angle = 180;
        }
        if (x2 < cx && y2 > cy) {//point在第三象限 完
          angle = 180 + angle;
        }
        if (x2 < cx && y2 == cy) {//point在x轴负方向
          angle = 270;
        }
        if (x2 < cx && y2 < cy) {// point在第二象限 完
          angle = 360 - angle;
        }
        if (x2 == cx && y2 < cy) {//point在y轴正方向上
          angle = 0;
        }
        if (x2 > cx && y2 < cy) {//point在第一象限 完
          angle = angle;
        }
        if (x2 > cx && y2 == cy) {//point在x轴正方向上
          angle = 90;
        }
        return angle;
      },
      radiansToDegress: function (rad) {
        return rad / Math.PI * 180;
      },
      describeOutArc: function (startAngle, endAngle) {
        var radius = this.options.radius
        var start = this.polarToCartesian(endAngle);
        var end = this.polarToCartesian(startAngle);
        var arcSweep = endAngle - startAngle >= 180 ? "0" : "1";
        return [
          "M", start.x, start.y,
          "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
        ].join(" ");
      },
      describeArc: function (startAngle, endAngle) {
        var radius = this.options.radius
        var start = this.polarToCartesian(endAngle);
        var end = this.polarToCartesian(startAngle);
        var arcSweep = endAngle - startAngle >= 180 ? "1" : '0';
        if (startAngle >= 180 && startAngle <= 360
          && endAngle >= 0 && endAngle <= 180
          && (360 - startAngle + endAngle) >= 180) {
          arcSweep = 1
        }
        return [
          "M", start.x, start.y,
          "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
        ].join(" ");
      },
      polarToCartesian: function (angleInDegrees) {
        var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
          x: this.options.cx + (this.options.radius * Math.cos(angleInRadians)),
          y: this.options.cy + (this.options.radius * Math.sin(angleInRadians))
        };
      }
    }
    return slider
  }).directive('airaslider', ['airRzSlider', function (airRzSlider) {
    return {
      scope: {
        rzSliderModel: '=?',
        rzSliderHigh: '=?',
        disabled: '=?',
        rzSliderOptions: '&?'
      },
      template: function () {
        return '<svg id="container" class="rzslider-container-svg" width="200" height="200">'
          + '<pattern id="minText" width="100%" height="100%"'
          + ' patternContentUnits="objectBoundingBox">'
          + '            <image width="1" height="1"'
          + ' xlink:href="./bower_components/angular-wangchunling/min.jpg"></image>'
          + '        </pattern>'
          + '<pattern id="maxText" width="100%" height="100%"'
          + ' patternContentUnits="objectBoundingBox">'
          + '            <image width="1" height="1" xlink:href="./bower_components/angular-wangchunling/max.jpg"></image>'
          + '        </pattern>'
          + '</svg>'
      },
      link: function (scope, elem) {
        scope.slider = new airRzSlider(scope, elem) //attach on scope so we can test it
      }
    }
  }])
  return module.name
})
