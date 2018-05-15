const Util = require('../../util/index');

const ALIAS_ATTRS = [ 'strokeStyle', 'fillStyle', 'globalAlpha' ];
const CAPITALIZED_ATTRS_MAP = {
  r: 'R',
  opacity: 'Opacity',
  lineWidth: 'LineWidth',
  clip: 'Clip',
  stroke: 'Stroke',
  fill: 'Fill',
  strokeOpacity: 'Stroke',
  fillOpacity: 'Fill',
  x: 'X',
  y: 'Y',
  rx: 'Rx',
  ry: 'Ry',
  re: 'Re',
  rs: 'Rs',
  width: 'Width',
  height: 'Height',
  img: 'Img',
  x1: 'X1',
  x2: 'X2',
  y1: 'Y1',
  y2: 'Y2',
  points: 'Points',
  p1: 'P1',
  p2: 'P2',
  p3: 'P3',
  p4: 'P4',
  text: 'Text',
  radius: 'Radius',
  textAlign: 'TextAlign',
  textBaseline: 'TextBaseline',
  font: 'Font',
  fontSize: 'FontSize',
  fontStyle: 'FontStyle',
  fontVariant: 'FontVariant',
  fontWeight: 'FontWeight',
  fontFamily: 'FontFamily',
  clockwise: 'Clockwise',
  startAngle: 'StartAngle',
  endAngle: 'EndAngle',
  path: 'Path',
  outline: 'Outline'
};
const SVG_ATTR_MAP = {
  opacity: 'opacity',
  clip: 'clip',
  stroke: 'stroke',
  fill: 'fill',
  strokeOpacity: 'stroke-opacity',
  fillOpacity: 'fill-opacity',
  strokeStyle: 'stroke',
  fillStyle: 'fill',
  x: 'x',
  y: 'y',
  r: 'r',
  rx: 'rx',
  ry: 'ry',
  re: 're',
  rs: 'rs',
  width: 'width',
  height: 'height',
  image: 'href',
  x1: 'x1',
  x2: 'x2',
  y1: 'y1',
  y2: 'y2',
  lineCap: 'stroke-linecap',
  lineJoin: 'stroke-linejoin',
  lineWidth: 'stroke-width',
  lineDash: 'stroke-dasharray',
  miterLimit: 'stroke-miterlimit',
  font: 'font',
  fontSize: 'font-size',
  fontStyle: 'font-style',
  fontVariant: 'font-variant',
  fontWeight: 'font-weight',
  fontFamily: 'font-family',
  startArrow: 'marker-start',
  endArrow: 'marker-end',
  preserveAspectRatio: 'preserveAspectRatio'
};
const ALIAS_ATTRS_MAP = {
  stroke: 'strokeStyle',
  fill: 'fillStyle',
  opacity: 'globalAlpha'
};

module.exports = {
  canFill: false,
  canStroke: false,
  initAttrs(attrs) {
    this.__attrs = {
      opacity: 1,
      fillOpacity: 1,
      strokeOpacity: 1
    };
    this.attr(Util.assign(this.getDefaultAttrs(), attrs));
    return this;
  },
  getDefaultAttrs() {
    return {};
  },
  /**
   * 设置或者设置属性，有以下 4 种情形：
   *   - name 不存在, 则返回属性集合
   *   - name 为字符串，value 为空，获取属性值
   *   - name 为字符串，value 不为空，设置属性值，返回 this
   *   - name 为键值对，value 为空，设置属性值
   *
   * @param  {String | Object} name  属性名
   * @param  {*} value 属性值
   * @return {*} 属性值
   */
  attr(name, value) {
    const self = this;
    if (arguments.length === 0) {
      return self.__attrs;
    }
    if (Util.isObject(name)) {
      for (const k in name) {
        if (ALIAS_ATTRS.indexOf(k) === -1) {
          const v = name[k];
          self._setAttr(k, v);
        }
      }
      if (self.__afterSetAttrAll) {
        self.__afterSetAttrAll(name);
      }
      // self.setSilent('box', null);
      self.clearBBox();
      return self;
    }
    if (arguments.length === 2) {
      self._setAttr(name, value);
      const m = '__afterSetAttr' + CAPITALIZED_ATTRS_MAP[name];
      if (CAPITALIZED_ATTRS_MAP[name] && self[m]) {
        self[m](value);
      }
      self.clearBBox();
      return self;
    }
    return self._getAttr(name);
  },
  clearBBox() {
    this.setSilent('box', null);
  },
  __afterSetAttrAll() {

  },
  // 属性获取触发函数
  _getAttr(name) {
    return this.__attrs[name];
  },
  // 属性设置触发函数
  _setAttr(name, value) {
    const self = this;
    const el = self.get('el');
    self.__attrs[name] = value;
    if (name === 'clip') {
      self.__setAttrClip(name, value);
    } else if (name === 'transform' || name === 'rotate') {
      self.__setAttrTrans(name, value);
    } else if (name.startsWith('shadow')) {
      self.__setAttrShadow(name, value);
    } else if (~[ 'stroke', 'strokeStyle', 'fill', 'fillStyle' ].indexOf(name) && /^[r,R,L,l]{1}[\s]+\(/.test(value.trim())) {
      self.__setAttrGradients(name, value.trim());
    } else if (~name.toLowerCase().indexOf('arrow')) {
      self.__setAttrArrow(name, value);
    } else {
      // 先存好属性，然后对一些svg和canvas中不同的属性进行特判
      if (~[ 'circle', 'ellipse', 'marker' ].indexOf(self.type) && ~[ 'x', 'y' ].indexOf(name)) {
        /**
         * 本来考虑想写到对应图形里面的，但是x,y又是svg通用属性，这样会同时存在x，y, cx,cy
         * 如果在下面svgAttr设置的时候还是要特判，不如就在这边特殊处理一下吧
         */
        if (self.type !== 'marker') {
          el.setAttribute('c' + name, value);
        }
      } else {
        let svgAttr = SVG_ATTR_MAP[name];
        if (el && svgAttr) {
          el.setAttribute(svgAttr, value);
        }
        const alias = ALIAS_ATTRS_MAP[name];
        if (alias) {
          svgAttr = SVG_ATTR_MAP[alias];
          if (el && svgAttr) {
            el.setAttribute(svgAttr, value);
          }
          self.__attrs[alias] = value;
        }
      }
    }
    return self;
  },
  hasFill() {
    return this.canFill && this.__attrs.fillStyle;
  },
  hasStroke() {
    return this.canStroke && this.__attrs.strokeStyle;
  },
  __setAttrArrow(name, value) {
    const self = this;
    const el = self.get('el');
    const defs = self.get('defs');
    if (!defs) {
      this.__setAttrDependency(name, value);
      return this;
    }
    name = SVG_ATTR_MAP[name];
    if (!name) {
      return this;
    }
    if (!value) {
      el.removeAttribute(name);
      return this;
    }
    let id = defs.find(name, { value, stroke: self.__attrs.stroke });
    if (!id) {
      id = defs.addArrow(name, value, self.__attrs.stroke);
    }
    self.__cfg[name] = id;
    self.get('el').setAttribute(name, `url(#${id})`);
  },
  __setAttrShadow(name, value) {
    const attrs = this.__attrs;
    const filter = this.get('filter');
    const defs = this.get('defs');
    if (!value) {
      this.get('el').removeAttribute('filter');
      return this;
    }
    if (filter) {
      defs.findById(filter).update(name, value);
      return this;
    }
    if (!defs) {
      this.__setAttrDependency(name, value);
      return this;
    }
    const cfg = {
      dx: attrs.shadowOffsetX,
      dy: attrs.shadowOffsetY,
      blur: attrs.shadowBlur,
      color: attrs.shadowColor
    };
    if (isNaN(Number(cfg.dx)) || isNaN(Number(cfg.dy))) {
      return this;
    }
    let id = defs.find('filter', cfg);
    if (!id) {
      id = defs.addShadow(cfg, this);
    }
    this.__cfg.filter = id;
    this.get('el').setAttribute('filter', `url(#${id})`);
  },
  __setAttrGradients(name, value) {
    name = name.replace('Style', '');
    const defs = this.get('defs');
    if (!value) {
      this.get('el').removeAttribute('gradient');
      return this;
    }
    if (!defs) {
      this.__setAttrDependency(name, value);
      return this;
    }
    let id = defs.find('gradient', value);
    if (!id) {
      id = defs.addGradient(value, this);
    }
    this.get('el').setAttribute(name, `url(#${id})`);
  },
  __setAttrDependency(name, value) {
    let dependencies = this.get('dependencies');
    if (!dependencies) {
      dependencies = {};
    }
    dependencies[name] = value;
    this.__cfg.dependencies = dependencies;
    return this;
  },
  __setAttrClip(name, value) {
    const defs = this.get('defs');
    if (!value) {
      this.get('el').removeAttribute('clip-path');
      return this;
    }
    if (!defs) {
      this.__setAttrDependency(name, value);
      return this;
    }

    const id = defs.addClip(value);
    this.get('el').setAttribute('clip-path', `url(#${id})`);
  },
  __setAttrTrans(name, value) {
    const attrs = this.__attrs;
    if (!value) {
      this.get('el').removeAttribute('transform');
    }
    if (!attrs.matrix) {
      this.initTransform();
    }
    if (name === 'transform') {
      this.transform(value);
    } else {
      this.transform([
        [ 't', -attrs.x, -attrs.y ],
        [ 'r', value ],
        [ 't', attrs.x, attrs.y ]
      ]);
    }
    return this;
  }
};
