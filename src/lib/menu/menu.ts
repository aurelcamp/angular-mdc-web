import {
  AfterViewInit,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  Renderer2,
  SimpleChange,
  ViewChild,
} from '@angular/core';
import { isBrowser, toBoolean, EventRegistry } from '@angular-mdc/web/common';

import { MDCMenuAdapter } from './adapter';
import { getTransformPropertyName } from '@material/menu/util';
import { MDCSimpleMenuFoundation } from '@material/menu/simple';

const topLeft = 'mdc-simple-menu--open-from-top-left';
const topRight = 'mdc-simple-menu--open-from-top-right';
const bottomLeft = 'mdc-simple-menu--open-from-bottom-left';
const bottomRight = 'mdc-simple-menu--open-from-bottom-right';

export type MdcMenuOpenFrom = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

let nextUniqueId = 0;
let uniqueIdCounter = 0;

@Directive({
  selector: '[mdc-menu-anchor]'
})
export class MdcMenuAnchor {
  @HostBinding('class.mdc-menu-anchor') isHostClass = true;

  constructor(public elementRef: ElementRef) { }
}

@Component({
  moduleId: module.id,
  selector: '[mdc-menu-divider], mdc-menu-divider',
  template: '<div class="mdc-list-divider" role="seperator"></div>',
})
export class MdcMenuDivider {
  constructor(public elementRef: ElementRef) { }
}

@Directive({
  selector: 'mdc-menu-items',
})
export class MdcMenuItems {
  @HostBinding('class.mdc-list') isHostClass = true;
  @HostBinding('class.mdc-simple-menu__items') isSelectClass = true;
  @HostBinding('attr.role') role: string = 'menu';
  @HostBinding('attr.aria-hidden') ariaHidden: string = 'true';

  constructor(public elementRef: ElementRef) { }
}

@Directive({
  selector: 'mdc-menu-item',
  host: {
    '[id]': 'id',
  },
})
export class MdcMenuItem {
  private _disabled: boolean = false;

  @Input() id: string = `mdc-menu-item-${uniqueIdCounter++}`;
  @Input() label: string;
  @Input()
  get disabled() {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = toBoolean(value);
    if (value) {
      this._renderer.setAttribute(this.elementRef.nativeElement, 'aria-disabled', 'true');
      this.tabindex = -1;
    } else {
      this._renderer.removeAttribute(this.elementRef.nativeElement, 'aria-disabled');
      this.tabindex = 0;
    }
  }
  @HostBinding('class.mdc-list-item') isHostClass = true;
  @HostBinding('attr.role') role: string = 'menuitem';
  @HostBinding('tabindex') tabindex: number = 0;

  constructor(
    private _renderer: Renderer2,
    public elementRef: ElementRef) { }
}

@Component({
  moduleId: module.id,
  selector: 'mdc-menu',
  host: {
    '[id]': 'id',
  },
  template: `
  <mdc-menu-items>
    <ng-content></ng-content>
  </mdc-menu-items>
  `,
  providers: [EventRegistry],
})
export class MdcMenu implements AfterViewInit, OnChanges, OnDestroy {
  private _uniqueId: string = `mdc-menu-${++nextUniqueId}`;
  private _previousFocus: any;

  @Input() id: string = this._uniqueId;
  @Input() openFrom: string | MdcMenuOpenFrom = 'topLeft';
  @Input() direction: 'ltr' | 'rtl' = 'ltr';
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() select: EventEmitter<any> = new EventEmitter();
  @HostBinding('class.mdc-simple-menu') isHostClass = true;
  @HostBinding('tabindex') tabindex: number = -1;
  @ViewChild(MdcMenuItems) menuContainer: MdcMenuItems;
  @ContentChildren(MdcMenuItem) options: QueryList<MdcMenuItem>;

  private _mdcAdapter: MDCMenuAdapter = {
    addClass: (className: string) => {
      this._renderer.addClass(this.elementRef.nativeElement, className);
    },
    removeClass: (className: string) => {
      this._renderer.removeClass(this.elementRef.nativeElement, className);
    },
    getAttributeForEventTarget: (target: any, attributeName) => {
      return target.getAttribute(attributeName);
    },
    hasClass: (className: string) => {
      return this.elementRef.nativeElement.classList.contains(className);
    },
    hasNecessaryDom: () => !!this.menuContainer,
    getInnerDimensions: () => {
      return {
        width: this.elementRef.nativeElement.offsetWidth,
        height: this.elementRef.nativeElement.offsetHeight
      };
    },
    hasAnchor: () => {
      return this._renderer.parentNode(this.elementRef.nativeElement)
        && this._renderer.parentNode(this.elementRef.nativeElement).classList.contains('mdc-menu-anchor');
    },
    getAnchorDimensions: () => {
      return this._renderer.parentNode(this.elementRef.nativeElement).getBoundingClientRect();
    },
    getWindowDimensions: () => {
      return {
        width: isBrowser() ? window.innerWidth : 0,
        height: isBrowser() ? window.innerHeight : 0
      };
    },
    setScale: (x: number, y: number) => {
      if (isBrowser()) {
        this._renderer.setStyle(this.elementRef.nativeElement, getTransformPropertyName(window), `scale(${x}, ${y})`);
      }
    },
    setInnerScale: (x: number, y: number) => {
      if (isBrowser()) {
        this._renderer.setStyle(this.menuContainer.elementRef.nativeElement, getTransformPropertyName(window), `scale(${x}, ${y})`);
      }
    },
    getNumberOfItems: () => {
      return this.options ? this.options.length : 0;
    },
    registerInteractionHandler: (type: string, handler: EventListener) => {
      this._registry.listen(type, handler, this.elementRef.nativeElement);
    },
    deregisterInteractionHandler: (type: string, handler: EventListener) => {
      this._registry.unlisten(type, handler);
    },
    registerBodyClickHandler: (handler: EventListener) => {
      if (isBrowser()) {
        this._registry.listen('click', handler, document.body);
      }
    },
    deregisterBodyClickHandler: (handler: EventListener) => {
      this._registry.unlisten('click', handler);
    },
    getYParamsForItemAtIndex: (index: number) => {
      const { offsetTop: top, offsetHeight: height } = this.options.toArray()[index].elementRef.nativeElement;
      return { top, height };
    },
    setTransitionDelayForItemAtIndex: (index: number, value: string) => {
      this._renderer.setStyle(this.options.toArray()[index].elementRef.nativeElement, 'transition-delay', value);
    },
    getIndexForEventTarget: (target: EventTarget) => {
      return this.options.toArray().findIndex((_) => _.elementRef.nativeElement === target);
    },
    notifySelected: (evtData: { index: number }) => {
      this.select.emit({
        index: evtData.index,
        item: this.options.toArray()[evtData.index].elementRef.nativeElement
      });
    },
    notifyCancel: () => {
      this.cancel.emit();
    },
    saveFocus: () => {
      if (isBrowser()) {
        this._previousFocus = document.activeElement;
      }
    },
    restoreFocus: () => {
      if (this._previousFocus) {
        this._previousFocus.focus();
      }
    },
    isFocused: () => {
      return this.elementRef.nativeElement.ownerDocument.activeElement === this.elementRef.nativeElement;
    },
    focus: () => {
      this.elementRef.nativeElement.focus();
    },
    getFocusedItemIndex: () => {
      return this.options.length ? this.options.toArray().findIndex(_ =>
        _.elementRef.nativeElement === this.elementRef.nativeElement.ownerDocument.activeElement) : -1;
    },
    focusItemAtIndex: (index: number) => {
      index ? this.options.toArray()[index].elementRef.nativeElement.focus() : this.elementRef.nativeElement.focus();
    },
    isRtl: () => this.direction === 'rtl',
    setTransformOrigin: (origin: string) => {
      if (isBrowser()) {
        this._renderer.setStyle(this.elementRef.nativeElement, `${getTransformPropertyName(window)}-origin`, origin);
      }
    },
    setPosition: (position) => {
      const { _renderer: renderer, elementRef: root } = this;
      position.left ? renderer.setStyle(root.nativeElement, 'left', 0) : renderer.removeStyle(root.nativeElement, 'left');
      position.right ? renderer.setStyle(root.nativeElement, 'right', 0) : renderer.removeStyle(root.nativeElement, 'right');
      position.top ? renderer.setStyle(root.nativeElement, 'top', 0) : renderer.removeStyle(root.nativeElement, 'top');
      position.bottom ? renderer.setStyle(root.nativeElement, 'bottom', 0) : renderer.removeStyle(root.nativeElement, 'bottom');
    },
    getAccurateTime: () => {
      return isBrowser() ? window.performance.now() : Date.now();
    }
  };

  private _foundation: {
    init: Function,
    destroy: Function,
    open: Function,
    close: Function,
    isOpen: Function
  } = new MDCSimpleMenuFoundation(this._mdcAdapter);

  constructor(
    private _renderer: Renderer2,
    public elementRef: ElementRef,
    private _registry: EventRegistry) { }

  ngAfterViewInit(): void {
    this._foundation.init();
  }

  ngOnDestroy(): void {
    this._foundation.destroy();
  }

  ngOnChanges(changes: { [key: string]: SimpleChange }): void {
    const change = changes['openFrom'];

    if (change) {
      if (change.previousValue) {
        this._mdcAdapter.removeClass(`${this._determineOpenFrom(change.previousValue)}`);
      }
      if (change.currentValue) {
        this._mdcAdapter.addClass(`${this._determineOpenFrom(change.currentValue)}`);
      }
    }
  }

  private _determineOpenFrom(value: string): string {
    switch (value) {
      case 'topRight': {
        return topRight;
      }
      case 'bottomLeft': {
        return bottomLeft;
      }
      case 'bottomRight': {
        return bottomRight;
      }
      default: {
        return topLeft;
      }
    }
  }

  isOpen(): boolean {
    return this._foundation.isOpen();
  }

  open(focusIndex?: number): void {
    if (!this.isOpen()) {
      this._foundation.open({ focusIndex: focusIndex });
    }
  }

  close(): void {
    this._foundation.close();
  }

  focus(): void {
    this._mdcAdapter.focus();
  }

  isFocused(): boolean {
    return this._mdcAdapter.isFocused();
  }

  getFocusedItemIndex(): number {
    return this._mdcAdapter.getFocusedItemIndex();
  }

  hasAnchor(): boolean {
    return this._mdcAdapter.hasAnchor();
  }

  isRtl(): boolean {
    return this._mdcAdapter.isRtl();
  }
}
