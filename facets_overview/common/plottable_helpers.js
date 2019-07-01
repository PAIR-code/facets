/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This file contains specializations of the plottable interaction classes so
// that they may work with Polymer 2 webcomponents. Standard plottable
// interactions don't work due to webcomponents' ShadowDOM usage.
// This is implemented in JS, as opposed to TS, because the plottable classes
// that this file subclasses have members that are private that are needed for
// this implementation.
// Webcomponents can use the PointerInteraction defined here instead of the
// plottable-provided one, in order to have interactions on those plots work
// as expected.

(function(plottable_helpers) {
  // Needed because parentElement does not work for webcomponents.
  function getHtmlElementAncestors(elem) {
    const elems = [];
    while (elem && elem instanceof HTMLElement) {
      elems.push(elem);
      if (elem.assignedSlot) {
        elem = elem.assignedSlot;
      } else if (!elem.parentElement) {
        const parentNode = elem.parentNode;
        if (parentNode instanceof DocumentFragment) {
          elem = parentNode.host;
        } else {
          // <html>.parentNode == <html>
          elem = parentNode !== elem ? parentNode : null;
        }
      } else {
        elem = elem.parentElement;
      }
    }
    return elems;
  }

  const _IDENTITY_TRANSFORM = [1, 0, 0, 1, 0, 0];

  function getCumulativeTransform(element) {
    const elems = getHtmlElementAncestors(element);

    let transform = _IDENTITY_TRANSFORM;
    let offsetParent = null;
    for (const elem of elems) {
      // Apply css transform from any ancestor element
      const elementTransform = Plottable.Utils.DOM.getElementTransform(elem);
      if (elementTransform != null) {
        const midX = elem.clientWidth / 2;
        const midY = elem.clientHeight / 2;
        transform = Plottable.Utils.Math.multiplyTranslate(transform, [midX, midY]);
        transform = Plottable.Utils.Math.multiplyMatrix(
          transform, Plottable.Utils.Math.invertMatrix(elementTransform));
        transform = Plottable.Utils.Math.multiplyTranslate(transform, [-midX, -midY]);
      }

      // Apply scroll offsets from any ancestor element
      let offsetX = elem.scrollLeft;
      let offsetY = elem.scrollTop;

      // Apply client+offset from only acenstor "offsetParent"
      if (offsetParent === null || elem === offsetParent) {
        offsetX -= elem.offsetLeft + elem.clientLeft;
        offsetY -= elem.offsetTop + elem.clientTop;
        offsetParent = elem.offsetParent;
      }
      transform = Plottable.Utils.Math.multiplyTranslate(
        transform, [offsetX, offsetY]);
    }
    return transform;
  }

  class CustomTranslator extends Plottable.Utils.Translator {
    computePosition(clientX, clientY) {
      const clientPosition = {
        x: clientX,
        y: clientY,
      };

      const transform = getCumulativeTransform(this._rootElement);
      if (transform == null) {
        return clientPosition;
      }

      const transformed = Plottable.Utils.Math.applyTransform(
        transform, clientPosition);
      return transformed;
    }
  }

  class MouseDispatcher extends Plottable.Dispatchers.Mouse {
    constructor(component) {
      super(component);
      // getRootNode return shadowRoot for webcomponents. For others, it returns
      // the document.
      this._eventTarget = component.root().rootElement().node();
      this._translator = new CustomTranslator(
        component.root().rootElement().node());
    }

    static getDispatcher(component) {
      const element = component.root().rootElement();
      let dispatcher = element[MouseDispatcher._DISPATCHER_KEY];

      if (!dispatcher) {
        dispatcher = new MouseDispatcher(component);
        element[MouseDispatcher._DISPATCHER_KEY] = dispatcher;
      }
      return dispatcher;
    }
  }

  class TouchDispatcher extends Plottable.Dispatchers.Touch {
    constructor(component) {
      super(component);
      // getRootNode return shadowRoot for webcomponents. For others, it returns
      // the document.
      this._eventTarget = component.root().rootElement().node();
      this._translator = new CustomTranslator(
        component.root().rootElement().node());
    }

    static getDispatcher(component) {
      const element = component.root().rootElement();
      let dispatcher = element[TouchDispatcher._DISPATCHER_KEY];

      if (!dispatcher) {
        dispatcher = new TouchDispatcher(component);
        element[TouchDispatcher._DISPATCHER_KEY] = dispatcher;
      }
      return dispatcher;
    }
  }

  class PointerInteraction extends Plottable.Interactions.Pointer {
    _anchor(component) {
      this._isAnchored = true;
      this._mouseDispatcher = MouseDispatcher.getDispatcher(
        this._componentAttachedTo);
      this._mouseDispatcher.onMouseMove(this._mouseMoveCallback);

      this._touchDispatcher = TouchDispatcher.getDispatcher(
        this._componentAttachedTo);
      this._touchDispatcher.onTouchStart(this._touchStartCallback);
    }
  }

  // Export only PointerInteraction.
  plottable_helpers.PointerInteraction = PointerInteraction;
})(window.plottable_helpers || (window.plottable_helpers = {}));
