import {
  AfterViewInit,
  Component,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { isBrowser, EventRegistry } from '@angular-mdc/web/common';

import { MDCToolbarAdapter } from './adapter';
import { MDCToolbarFoundation } from '@material/toolbar';

@Directive({
  selector: '[mdc-toolbar-icon]'
})
export class MdcToolbarIcon {
  @HostBinding('class.mdc-toolbar__icon') isHostClass = true;

  constructor(public elementRef: ElementRef) { }
}

@Directive({
  selector: 'mdc-toolbar-section'
})
export class MdcToolbarSection {
  @Input() alignStart: boolean = false;
  @Input() alignEnd: boolean = false;
  @Input() shrinkToFit: boolean = false;
  @HostBinding('class.mdc-toolbar__section') isHostClass = true;
  @HostBinding('class.mdc-toolbar__section--align-start') get classAlignStart(): string {
    return this.alignStart ? 'mdc-toolbar__section--align-start' : '';
  }
  @HostBinding('class.mdc-toolbar__section--align-end') get classAlignEnd(): string {
    return this.alignEnd ? 'mdc-toolbar__section--align-end' : '';
  }
  @HostBinding('class.mdc-toolbar__section--shrink-to-fit') get classShrinkToFit(): string {
    return this.shrinkToFit ? 'mdc-toolbar__section--shrink-to-fit' : '';
  }
}

@Directive({
  selector: '[mdc-toolbar-title], mdc-toolbar-title'
})
export class MdcToolbarTitle {
  @HostBinding('class.mdc-toolbar__title') isHostClass = true;

  constructor(public elementRef: ElementRef) { }
}

@Directive({
  selector: '[mdc-toolbar-fixed-adjust], mdc-toolbar-fixed-adjust'
})
export class MdcToolbarFixedAdjust {
  @HostBinding('class.mdc-toolbar-fixed-adjust') isHostClass = true;

  constructor(public elementRef: ElementRef) { }
}

@Directive({
  selector: 'mdc-toolbar-row'
})
export class MdcToolbarRow {
  @HostBinding('class.mdc-toolbar__row') isHostClass = true;

  constructor(public elementRef: ElementRef) { }
}

@Directive({
  selector: '[mdc-toolbar-menu-icon]'
})
export class MdcToolbarMenuIcon {
  @HostBinding('class.mdc-toolbar__menu-icon') isHostClass = true;

  constructor(public elementRef: ElementRef) { }
}

@Component({
  moduleId: module.id,
  selector: 'mdc-toolbar',
  template: '<ng-content></ng-content>',
  providers: [EventRegistry],
  encapsulation: ViewEncapsulation.None,
})
export class MdcToolbar implements AfterViewInit, OnDestroy {
  @Input() flexible: boolean = false;
  @Input() flexibleDefaultBehavior: boolean = true;
  @Input() fixed: boolean = false;
  @Input() waterfall: boolean = false;
  @Input() fixedLastrow: boolean = false;
  @Input() adjustBodyMargin: boolean = true;
  @Output() change: EventEmitter<number> = new EventEmitter<number>();
  @ContentChild(MdcToolbarRow) firstRow: MdcToolbarRow;
  @ContentChild(MdcToolbarTitle) title: MdcToolbarTitle;
  @HostBinding('class.mdc-toolbar') isHostClass = true;
  @HostBinding('class.mdc-toolbar--fixed') get classFixedToolbar(): string {
    return this.fixed ? 'mdc-toolbar--fixed' : '';
  }
  @HostBinding('class.mdc-toolbar--waterfall') get classWaterfallToolbar(): string {
    return this.waterfall ? 'mdc-toolbar--waterfall' : '';
  }
  @HostBinding('class.mdc-toolbar--flexible') get classFlexibleToolbar(): string {
    return this.flexible ? 'mdc-toolbar--flexible' : '';
  }
  @HostBinding('class.mdc-toolbar--fixed-lastrow-only') get classFixedLastrow(): string {
    return this.fixedLastrow ? 'mdc-toolbar--fixed-lastrow-only' : '';
  }
  @HostBinding('class.mdc-toolbar--flexible-default-behavior') get classFlexibleDefaultBehavior(): string {
    return this.flexible && this.flexibleDefaultBehavior ? 'mdc-toolbar--flexible-default-behavior' : '';
  }

  private _mdcAdapter: MDCToolbarAdapter = {
    hasClass: (className: string) => {
      return this.elementRef.nativeElement.classList.contains(className);
    },
    addClass: (className: string) => {
      this._renderer.addClass(this.elementRef.nativeElement, className);
    },
    removeClass: (className: string) => {
      this._renderer.removeClass(this.elementRef.nativeElement, className);
    },
    registerScrollHandler: (handler: EventListener) => {
      if (isBrowser()) {
        this._registry.listen('scroll', handler, window);
      }
    },
    deregisterScrollHandler: (handler: EventListener) => {
      if (isBrowser()) {
        this._registry.unlisten('scroll', handler);
      }
    },
    registerResizeHandler: (handler: EventListener) => {
      if (isBrowser()) {
        this._registry.listen('resize', handler, window);
      }
    },
    deregisterResizeHandler: (handler: EventListener) => {
      if (isBrowser()) {
        this._registry.unlisten('resize', handler);
      }
    },
    getViewportWidth: () => {
      return isBrowser() ? window.innerWidth : 0;
    },
    getViewportScrollY: () => {
      return isBrowser() ? window.pageYOffset : 0;
    },
    getOffsetHeight: () => this.elementRef.nativeElement.offsetHeight,
    getFirstRowElementOffsetHeight: () => {
      return this.firstRow ? this.firstRow.elementRef.nativeElement.offsetHeight : 0;
    },
    notifyChange: (evtData: { flexibleExpansionRatio: number }) => {
      this.change.emit(evtData.flexibleExpansionRatio);
    },
    setStyle: (property: string, value: string) => {
      this._renderer.setStyle(this.elementRef.nativeElement, property, value);
    },
    setStyleForTitleElement: (property: string, value: string) => {
      if (this.title) {
        this._renderer.setStyle(this.title.elementRef.nativeElement, property, value);
      }
    },
    setStyleForFlexibleRowElement: (property: string, value: string) => {
      if (this.firstRow) {
        this._renderer.setStyle(this.firstRow.elementRef.nativeElement, property, value);
      }
    },
    setStyleForFixedAdjustElement: (property: string, value: string) => {
      if (!isBrowser()) { return; }
      if (this.fixed && this.adjustBodyMargin) {
        this._renderer.setStyle(document.body, property, value);
      }
    }
  };

  private _foundation: {
    init: Function,
    destroy: Function,
    updateAdjustElementStyles: Function
  } = new MDCToolbarFoundation(this._mdcAdapter);

  constructor(
    private _renderer: Renderer2,
    public elementRef: ElementRef,
    private _registry: EventRegistry) { }

  ngAfterViewInit(): void {
    this._foundation.init();
  }

  ngOnDestroy(): void {
    if (isBrowser() && this.fixed && this.adjustBodyMargin) {
      this._renderer.removeStyle(document.body, 'margin-top');
    }
    this._foundation.destroy();
  }

  updateAdjustElementStyles(): void {
    this._foundation.updateAdjustElementStyles();
  }
}
