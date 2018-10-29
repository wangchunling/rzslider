/**
 * @author: wangchunling
 * @description:
 * @Date: 2018/10/25 上午11:20
 */
;(function (root, factory) {
    'use strict'
    /* istanbul ignore next */
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
            const container = document.getElementById('container')
            const containerWidth = container.clientWidth
                || container.parentNode.clientWidth;
            const containerHeight = container.clientHeight
                || container.parentNode.clientHeight;
            const windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth
                || 0);
            const windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight
                || 0);
            const width = containerWidth < windowWidth ? containerWidth : windowWidth;
            const height = containerHeight < windowHeight ? containerHeight : windowHeight;
            let drawWidth = width
            let drawHeight = height
            const innerRad = defaultOptions.innerRad // 内圆总度数
            let min = minVal
            let max = maxVal
            let minIndex = options.stepArray.findIndex(v => v == min)
            let maxIndex = options.stepArray.findIndex(v => v == max)
            let cminVal = options.stepArray[minIndex]
            var cmaxVal = options.stepArray[maxIndex]
            const minstartAngle = (225 + (innerRad / options.stepArray.length) * minIndex)
            const maxstartAngle = (225 + (innerRad / options.stepArray.length) * maxIndex)
            const startAngle = Math.floor(minstartAngle >= 360 ? minstartAngle - 360
                : minstartAngle);  // start deg
            const endAngle = Math.floor(maxstartAngle <= 360 ? maxstartAngle : maxstartAngle - 360)
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
            this.setBulk = function (options) {
                for (let key in options) {
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
    }).factory('RzSlider', function (
        RzSliderOptions,
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
                self.updateData()
                self.createEvent()

                this.scope.$watch('rzSliderModel', function (newValue, oldValue) {
                    if (newValue === oldValue) return
                    self.applyOptions()
                    self.lock = {
                        flag: true
                    }
                    self.changView(self.options)
                })
                this.scope.$watch('rzSliderHigh', function(newValue ,oldValue){
                    if (newValue === oldValue) return
                    self.applyOptions()
                    self.lock = {
                        flag: true
                    }
                    self.changView(self.options)

                })
                this.scope.$watch('disabled', function(newValue ,oldValue){
                    if (newValue === oldValue) return
                    self.applyOptions()
                    self.lock = {
                        flag: true
                    }
                    self.changView(self.options)

                })
                this.scope.$watchCollection('rzSliderOptions()', function (newValue, oldValue) {
                    if (newValue === oldValue) return
                    self.applyOptions()
                    self.lock = {
                        flag: true
                    }
                    self.changView(self.options)
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
                var disabled = this.scope.disabled
                this.options = RzSliderOptions.getOptions(sliderOptions, minVal, maxVal)
                this.options.minValue = minVal
                this.options.maxValue = maxVal
                this.options.disabled = disabled
                this.options.minPos = this.polarToCartesian(this.options.innerCircleStartAngle);
                this.options.maxPos = this.polarToCartesian(this.options.innerCircleEndAngle);
                this.lock = null
                this.oldX = this.options.cx;
                this.oldY = this.options.cy
                this.oldOffset = this.options.startAngle;
                this.options.posMap = {}
            },
            findBin: function (ex, ey) {
                let bins = this.options.stepArray
                let innerCircleStartAngle = this.options.innerCircleStartAngle
                let innerCircleEndAngle = this.options.innerCircleEndAngle
                let cx = this.options.cx
                let cy = this.options.cy
                let cmaxVal = this.options.cmaxVal
                let cminVal = this.options.cminVal
                let stepArray = this.options.stepArray
                let minIndex = this.options.minIndex
                let x = Math.floor(this.getAngle(cx, cy, ex, ey))
                let evey = this.options.innerRad / bins.length
                // 角度x 在 开始角度和360度之间,
                let index
                if (innerCircleStartAngle <= x && x <= 360) {
                    index = Math.floor((x - innerCircleStartAngle) / evey)
                } else if (0 <= x && x <= innerCircleEndAngle) {
                    index = Math.floor((x + (360 - innerCircleStartAngle)) / evey) - 1
                }
                if (!!this.lock && this.lock.flag) {
                    cmaxVal = bins[index]
                } else if (!!this.lock && !this.lock.flag) {
                    cminVal = bins[index]
                }
                if (cminVal == undefined) {
                    cminVal = stepArray[minIndex]
                } else if (cmaxVal == undefined) {
                    cminVal = stepArray[minIndex]
                }
                this.options.cmaxVal = cmaxVal
                this.options.cminVal = cminVal
                return `${cminVal} -  ${cmaxVal}`
            },
            createDom() {
                let innerCircleStartAngle = this.options.innerCircleStartAngle
                let innerCircleEndAngle = this.options.innerCircleEndAngle
                let cx = this.options.cx
                let cy = this.options.cy
                let radius = this.options.radius
                let endAngle = this.options.endAngle
                let startAngle = this.options.startAngle
                let container = this.container
                let innerCircle = new SVGElement('path', {
                    'cx': cx,
                    'cy': cy,
                    'r': radius,
                    'fill': 'none',
                    'stroke-linecap': 'round',
                    'stroke': '#D2D2D2',
                    'stroke-width': 25,
                    'stroke-dashoffset': '0',
                    'd': this.describeArc(innerCircleStartAngle, innerCircleEndAngle)
                });
                container.appendChild(innerCircle.element());
                const startPos = this.polarToCartesian(endAngle);
                const endPos = this.polarToCartesian(startAngle)
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
                    'r': 12,
                    'fill': 'white',
                    'stroke': '#03B7E6',
                    'stroke-width': 1
                });
                container.appendChild(this.handler1.element());
                this.handler = new SVGElement('circle', {
                    'id': 'circle',
                    'cx': startPos['x'],
                    'cy': startPos['y'],
                    'r': 12,
                    'fill': 'white',
                    'stroke': '#03B7E6',
                    'stroke-width': 1
                });
                container.appendChild(this.handler.element());

                let placeholder = container.getElementById('dataPlaceholder');
                if (placeholder === null) {
                    placeholder = new SVGElement('g', {
                        'id': 'dataPlaceholder',
                    }).element();
                    container.appendChild(placeholder);
                }
                const ftext = new SVGElement('text', {
                    'x': 70,
                    'y': 85,
                    'fill': '#01B1EC',
                    'font-size': '12px',
                    'font-family': 'Verdana'
                });
                ftext.element().textContent = '风量(m³/h)'

                this.maxtext =  new SVGElement('text', {
                    'id': 'maxText',
                    'x': startPos['x'] - 11,
                    'y': startPos['y'] + 3,
                    'fill': '#01B1EC',
                    'font-size': '10px',
                    'font-family': 'Verdana'
                })
                this.maxtext.element().textContent = 'max'

                this.mintext =  new SVGElement('text', {
                    'id': 'minText',
                    'x': endPos['x'] - 10,
                    'y': endPos['y'] + 2,
                    'fill': '#01B1EC',
                    'font-size': '10px',
                    'font-family': 'Verdana'
                })
                this.mintext.element().textContent = 'min'
                placeholder.appendChild(this.mintext.element())
                placeholder.appendChild(this.maxtext.element())
                placeholder.appendChild(ftext.element())
                this.text = new SVGElement('text', {
                    'x': 68,
                    'y': 110,
                    'fill': '#01B1EC',
                    'font-size': '16px',
                    'textLength' : '70',
                    'font-family': 'Verdana'
                });
                placeholder.appendChild(this.text.element());
            },
            createEvent() {
                this.maxtext.addEventListener('mousedown', this.mousedown.bind(this));
                this.maxtext.addEventListener('touchstart', this.touchstart.bind(this));

                this.mintext.addEventListener('mousedown', this.mousedown.bind(this));
                this.mintext.addEventListener('touchstart', this.touchstart.bind(this));
            },
            eventInit: function () {
                this.lock = {}
                let flag = event.srcElement.id == 'maxText'
                this.lock.target = flag ? this.maxtext : this.mintext
                this.lock.flag = flag
                if (flag) {
                    this.mintext.removeEventListener('mousemove', this.mousemove.bind(this))
                    this.mintext.removeEventListener('mouseup', this.mouseup.bind(this))
                } else {
                    this.maxtext.removeEventListener('mousemove', this.mousemove.bind(this))
                    this.maxtext.removeEventListener('mouseup', this.mouseup.bind(this))
                }
            },
            mousedown: function (event) {
                event.preventDefault();
                this.eventInit()
                window.addEventListener('mousemove', this.mousemove.bind(this));
                window.addEventListener('mouseup', this.mouseup.bind(this));
            },
            touchstart: function (event) {
                this.eventInit()
                event.stopPropagation()
                window.addEventListener('touchmove', this.touchmove.bind(this));
                window.addEventListener('touchend', this.touchend.bind(this));
            },
            mousemove: function (event) {
                event.preventDefault();
                if (this.options.disabled) {
                    this.moveHandler(event.clientX, event.clientY);
                }
            },
            touchmove: function (event) {
                // Ignore multi-touch
                if (event.touches.length > 1) {
                    return;
                }
                this.moveHandler(event.touches[0].pageX, event.touches[0].pageY);
            },
            mouseup: function (event) {
                event.preventDefault();
                window.removeEventListener('mousemove', this.mousemove);
                window.removeEventListener('mouseup', this.mouseup);
            },
            touchend: function (event) {
                event.preventDefault();
                window.removeEventListener('touchmove', this.touchmove);
                window.removeEventListener('touchend', this.touchend);
            },
            moveHandler: function (x, y) {
                // calculate new handler position
                const minOffset = 225; // 最小值
                const maxOffset = 125; //最大值
                const lock = this.lock
                const posMap = this.options.posMap
                const cx = this.options.cx
                const cy = this.options.cy
                const radius = this.options.radius
                const minPos = this.options.minPos
                const maxPos = this.options.maxPos
                const dx = x - cx;
                const dy = y - cy;
                const scale = radius / Math.hypot(dx, dy);
                let newX = dx * scale + cx;
                let newY = dy * scale + cy;
                let offset;
                // handler is locked at min or max position
                if (newX > minPos.x && newY > minPos.y && !lock.flag) {
                    newX = minPos['x'];
                    newY = minPos['y'];
                    offset = minOffset
                }
                if (newY > maxPos.y && this.oldX > newX  && lock.flag) {
                    newX = maxPos['x'];
                    newY = maxPos['y'];
                    offset = minOffset
                    return
                }
                else {
                    // calculate offset (between 0 and 360 degrees)
                    let fi = Math.atan(dx / -dy);
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
                let element = this.lock.target
                let pathStr = this.setPathPosition(newX, newY)
                let disable = false
                if (!!posMap.sxAng && Math.abs(posMap.sxAng - posMap.edAng) <= 0.1
                    || (posMap.startx >= cx && posMap.sxAng >= posMap.edAng)
                    || posMap.startx >= cx && posMap.edAng >= posMap.sxAng && posMap.edAng >= this.options.innerCircleEndAngle
                    || (posMap.startx <= cx && posMap.sxAng >= posMap.edAng) && (posMap.edAng >= 180
                        && posMap.edAng <= 360)
                ) {
                    disable = true
                }
                //setHandlerPosition(handler1, newX, newY);
                // change outer circle offset
                if (!disable && !this.options.disabled) {
                    this.setHandlerPosition(element, newX - 11, newY + 3);
                    let cirHandle = this.lock.flag ? this.handler : this.handler1
                    this.setCirHandlerPosition(cirHandle, newX, newY)
                    this.updateData(newX, newY);
                    this.setCircleOffset(pathStr);

                }
            },
            changView(options) {
                let min = options['minValue']
                let max = options['maxValue']
                let minIndex = options.stepArray.findIndex(v => v == min)
                let maxIndex = options.stepArray.findIndex(v => v == max)
                let innerRad = options.innerRad
                let cminVal = options.stepArray[minIndex]
                var cmaxVal = options.stepArray[maxIndex]
                const minstartAngle = (225 + (innerRad / options.stepArray.length) * minIndex)
                const maxstartAngle = (225 + (innerRad / options.stepArray.length) * maxIndex)
                const startAngle = Math.floor(minstartAngle >= 360 ? minstartAngle - 360
                    : minstartAngle);  // start deg
                const endAngle = Math.floor(maxstartAngle <= 360 ? maxstartAngle : maxstartAngle - 360)
                var start = this.polarToCartesian(endAngle);
                var end = this.polarToCartesian(startAngle);
                self.lock = true

                this.setHandlerPosition(this.maxtext, start.x - 11,start.y + 3)
                this.setHandlerPosition(this.mintext, end.x - 11 ,end.y + 3)
                this.setCirHandlerPosition(this.handler, start.x ,start.y)
                this.setCirHandlerPosition(this.handler1, end.x ,end.y)

                let dstr = this.setPathPosition(start.x, start.y)
                this.setCircleOffset(dstr)
                this.text.element().textContent = `${cminVal} -  ${cmaxVal}`

            },
            setCirHandlerPosition: function (element, centerX, centerY) {
                element.set('cx', centerX);
                element.set('cy', centerY);
            },
            setHandlerPosition: function (element, centerX, centerY) {
                element.set('x', centerX);
                element.set('y', centerY);
            },
            setPathPosition: function (x, y) {
                let endAngle = this.options.endAngle
                let startAngle = this.options.startAngle
                var start = this.polarToCartesian(endAngle);
                var end = this.polarToCartesian(startAngle);
                var lock = this.lock
                const cx = this.options.cx
                const cy = this.options.cy
                const radius = this.options.radius
                const posMap = this.options.posMap
                // handle1 setting  start里取
                let dstr = ''
                if (lock.flag) {
                    posMap.startx = !posMap.startx ? end.x : posMap.startx
                    posMap.starty = !posMap.starty ? end.y : posMap.starty
                    posMap.endx = x
                    posMap.endy = y
                    let sxAng = this.getAngle(cx, cy, posMap.startx, posMap.starty)
                    let edAng = this.getAngle(cx, cy, posMap.endx, posMap.endy)
                    posMap.edAng = edAng
                    posMap.sxAng = sxAng
                    let flag = sxAng - edAng <= 180 && edAng >= 0 && edAng <= 180 && sxAng >= 180
                        && sxAng <= 360
                    dstr = [
                        "M", x, y,
                        "A", radius, radius, 0, flag ? 1 : 0, 0, posMap.startx, posMap.starty,
                    ].join(" ")
                } else {
                    posMap.startx = x,
                        posMap.starty = y
                    posMap.endx = !posMap.endx ? start.x : posMap.endx
                    posMap.endy = !posMap.endy ? start.y : posMap.endy
                    let sxAng = this.getAngle(cx, cy, posMap.startx, posMap.starty)
                    let edAng = this.getAngle(cx, cy, posMap.endx, posMap.endy)
                    posMap.edAng = edAng
                    posMap.sxAng = sxAng
                    let flag = sxAng - edAng >= 180
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
            getAngle: function (cx, cy, x2, y2) {
                var x = Math.abs(cx - x2);
                var y = Math.abs(cy - y2);
                var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                var tan = x / y;
                var radina = Math.atan(tan);//用反三角函数求弧度
                var angle = Math.floor(180 / (Math.PI / radina)) || 0;//将弧度转换成角度
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
            describeArc: function (startAngle, endAngle) {
                let radius = this.options.radius
                var start = this.polarToCartesian(endAngle);
                var end = this.polarToCartesian(startAngle);
                var arcSweep = endAngle - startAngle >= 180 ? "0" : "1";
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
            template: function() {
                return '<svg id="container" width="200" height="200"></svg>'
            },
            link: function (scope, elem) {
                scope.slider = new RzSlider(scope, elem) //attach on scope so we can test it
            }
        }
    }])
    return module.name
})
