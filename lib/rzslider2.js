;(function (root, factory) {
  'use strict'
  /* istanbul ignore next */
  if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
      value: function(predicate) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;

        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }

        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
        var thisArg = arguments[1];

        // 5. Let k be 0.
        var k = 0;

        // 6. Repeat, while k < len
        while (k < len) {
          // a. Let Pk be ! ToString(k).
          // b. Let kValue be ? Get(O, Pk).
          // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
          // d. If testResult is true, return k.
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return k;
          }
          // e. Increase k by 1.
          k++;
        }

        // 7. Return -1.
        return -1;
      },
      configurable: true,
      writable: true
    });
  }
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['angular'], factory)
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    // to support bundler like browserify
    var angularObj = angular || require('angular')
    if ((!angularObj || !angularObj.module) && typeof angular != 'undefined') {
      angularObj = angular
    }
    module.exports = factory(angularObj)
  } else {
    // Browser globals (root is window)
    factory(root.angular)
  }
})(this, function (angular) {
  var module = angular.module('rzModule', []).factory('RzSliderOptions', function () {
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
        containerTop: container.getBoundingClientRect().top,
        containerLeft: container.getBoundingClientRect().left,
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
  }).factory('RzSlider', function (RzSliderOptions,
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
        var startPos = this.polarToCartesian(this.options.endAngle)
        self.updateData(startPos.x, startPos.y)
        self.createEvent()
        this.move = false
        this.scope.$watch('rzSliderModel', function (newValue, oldValue) {
          if (newValue === oldValue && !self.move) {
            return
          }
          // self.applyOptions()
          self.view2model()
          self.changView(self.options)
        })
        this.scope.$watch('rzSliderHigh', function (newValue, oldValue) {
          if (newValue === oldValue) {
            return
          }
          self.view2model()
          self.changView(self.options)
        })
        this.scope.$watch('disabled', function (newValue, oldValue) {
          if (newValue === oldValue) {
            return
          }
          if (!self.scope.disabled) {
            self.view2model()
            self.changView(self.options)
          }
        })
        // this.scope.$watchCollection('rzSliderOptions()', function (newValue, oldValue) {
        //   if (newValue === oldValue) {
        //     return
        //   }
        //   self.applyOptions()
        //   self.lock = {
        //     flag: true
        //   }
        //   self.changView(self.options)
        // })
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
        this.options = RzSliderOptions.getOptions(sliderOptions, minVal, maxVal)
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
        this.options.cmaxVal = cmaxVal
        this.options.cminVal = cminVal
        return cminVal + " -  " + cmaxVal
      },
      createDom: function() {
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
        var innerCircle = new SVGElement('path', {
          'cx': cx,
          'cy': cy,
          'r': radius,
          'fill': 'none',
          'stroke-linecap': 'round',
          'stroke': '#D2D2D2',
          'stroke-width': 25,
          'stroke-dashoffset': '0',
          'd': this.describeOutArc(innerCircleStartAngle + 2, innerCircleEndAngle - 2)
        });
        container.appendChild(innerCircle.element());
        var startPos = this.polarToCartesian(endAngle);
        var endPos = this.polarToCartesian(startAngle)
        this.outerCircle = new SVGElement('path', {
          'fill': 'none',
          'stroke': this.options.color,
          'stroke-width': 20,
          'd': this.describeArc(startAngle, endAngle)
        });
        container.appendChild(this.outerCircle.element());
        this.handler1 = new SVGElement('circle', {
          'id': 'circle1',
          'cx': endPos['x'],
          'cy': endPos['y'],
          'z-index': '2',
          'r': 14,
          'fill': 'url(#minText)'
        });
        container.appendChild(this.handler1.element());
        this.handler = new SVGElement('circle', {
          'id': 'circle',
          'cx': startPos['x'],
          'cy': startPos['y'],
          'r': 14,
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
        var ftext = new SVGElement('text', {
          'x': 70,
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
        ftext.element().textContent = '风量(m³/h)'
        this.maxtext.element().textContent = this.options.stepArray[this.options.stepArray.length - 1]
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
      },
      createEvent: function() {
        this.handler.addEventListener('mousedown', this.mousedown.bind(this));
        this.handler.addEventListener('touchstart', this.touchstart.bind(this));
        this.handler1.addEventListener('mousedown', this.mousedown.bind(this));
        this.handler1.addEventListener('touchstart', this.touchstart.bind(this));
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
        container.addEventListener('mousemove', this.mousemove.bind(this));
        container.addEventListener('mouseup', this.mouseup.bind(this));
      },
      touchstart: function (event) {
        this.eventInit()
        event.stopPropagation()
        event.preventDefault();
        var container = document.getElementById('container');
        container.addEventListener('touchmove', this.touchmove.bind(this));
        container.addEventListener('touchend', this.touchend.bind(this));
      },
      mousemove: function (event) {
        event.preventDefault();
        event.stopPropagation()
        if (this.options.disabled) {
          var x = this.options.containerLeft
          var y = this.options.containerTop
          this.moveHandler(event.clientX - x , event.clientY - y);
        }
      },
      touchmove: function (event) {
        // Ignore multi-touch
        if (event.touches.length > 1) {
          return;
        }
        event.stopPropagation()
        event.preventDefault();
        var x = this.options.containerLeft
        var y = this.options.containerTop
        this.moveHandler(event.touches[0].pageX - x, event.touches[0].pageY - y);
      },
      mouseup: function (event) {
        event.stopPropagation()
        event.preventDefault();
        window.removeEventListener('mousemove', this.mousemove);
        window.removeEventListener('mouseup', this.mouseup);
      },
      touchend: function (event) {
        event.stopPropagation()
        event.preventDefault();
        window.removeEventListener('touchmove', this.touchmove);
        window.removeEventListener('touchend', this.touchend);
      },
      moveHandler: function (x, y) {
        this.move = true
        // calculate new handler position
        var minOffset = 225; // 最小值
        var maxOffset = 125; //最大值
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
        if (newY > maxPos.y && this.oldX > newX && lock.flag) {
          newX = maxPos['x'];
          newY = maxPos['y'];
          offset = minOffset
          return
        }
        else {
          // calculate offset (between 0 and 360 degrees)
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
        }
        // save current offset
        this.oldOffset = offset;
        // set new handler circle position
        var element = this.lock.target
        var pathStr = this.setPathPosition(newX, newY)
        var disable = false
        if (!this.lock.flag && this.options.cminVal !== stepArray[0] && this.options.cminVal !== this.options.cmaxVal) {
          this.swapElements(this.handler.element(), this.handler1.element())
        } else if(this.lock.flag && this.options.cmaxVal !== stepArray[stepArray.length - 1] && this.options.cminVal !== this.options.cmaxVal ){
          this.swapElements(this.handler1.element(), this.handler.element())
        }
        if (!!posMap.sxAng && posMap.sxAng == posMap.edAng
          // && Math.abs(posMap.sxAng - posMap.edAng) <= 0.1
          || (posMap.startx >= cx && posMap.sxAng >= posMap.edAng)
          || posMap.startx >= cx && (posMap.endx <= cx) && posMap.edAng
          >= this.options.innerCircleEndAngle
          || posMap.endx >= cx && posMap.edAng >= (this.options.innerCircleEndAngle + 4)
          || newX > minPos.x && newY > minPos.y && !lock.flag
          || (posMap.startx <= cx && posMap.sxAng >= posMap.edAng) && (posMap.edAng >= 180
            && posMap.edAng <= 360) && posMap.sxAng >= posMap.edAng
        ) {
          disable = true
        }
        //setHandlerPosition(handler1, newX, newY);
        // change outer circle offset
        if (!disable && !this.scope.disabled) {
          this.setHandlerPosition(element, newX, newY);
          this.updateData(newX, newY);
          this.setCircleOffset(pathStr);
          this.updateModel()
        }
      },
      updateModel: function() {
        this.scope.rzSliderModel = this.options.cminVal
        this.scope.rzSliderHigh = this.options.cmaxVal
        this.scope.$apply()
      },
      view2model: function(self) {
        this.options.cminVal = this.scope.rzSliderModel
        this.options.cmaxVal = this.scope.rzSliderHigh
        this.options['minValue'] = this.scope.rzSliderModel
        this.options['maxValue'] = this.scope.rzSliderHigh
      },
      changView: function(options) {
        var min = options['minValue']
        var max = options['maxValue']
        var minIndex = options.stepArray.findIndex(function (v) {
          return v == min
        });
        var maxIndex = options.stepArray.findIndex(function (v) {
          return v == max
        });
        var innerRad = options.innerRad
        var minstartAngle = (225 + (innerRad / options.stepArray.length) * (minIndex)) // 改动
        var maxstartAngle = (225 + (innerRad / options.stepArray.length) * (maxIndex + 1))
        var startAngle = Math.floor(minstartAngle >= 360 ? minstartAngle - 360
          : minstartAngle);  // start deg
        var endAngle = Math.floor(maxstartAngle <= 360 ? maxstartAngle : maxstartAngle - 360)
        var start = this.polarToCartesian(endAngle);
        var end = this.polarToCartesian(startAngle);
        this.setHandlerPosition(this.handler, start.x, start.y)
        this.setHandlerPosition(this.handler1, end.x, end.y)
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
  }).directive('rzslider', ['RzSlider', function (RzSlider) {
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
        scope.slider = new RzSlider(scope, elem) //attach on scope so we can test it
      }
    }
  }])
  return module.name
})
