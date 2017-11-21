import { OverlayRef } from '../cdk/overlay/overlay-ref';
import { MdcDialogContainer } from './dialog-container';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

let uniqueId = 0;

/**
 * Reference to a dialog dispatched from the MdcDialog service.
 */
export class MdcDialogRef<T> {
  componentInstance: T;

  /** Subject for notifying the user that the dialog has finished opening. */
  private _afterOpen = new Subject<void>();

  /** Subject for notifying the user that the dialog has finished closing. */
  private _afterClosed = new Subject<any>();

  /** Subject for notifying the user that the dialog has started closing. */
  private _beforeClose = new Subject<any>();

  /** Result to be passed to afterClosed. */
  private _result: any;

  constructor(
    private _overlayRef: OverlayRef,
    public _containerInstance: MdcDialogContainer,
    readonly id: string = `mdc-dialog-${uniqueId++}`) { }

  /** Closes the dialog. */
  close(): void {
    this._overlayRef.dispose();
  }

  /**
   * Gets an observable that is notified when the dialog is finished opening.
   */
  afterOpen(): Observable<void> {
    return this._afterOpen.asObservable();
  }

  /**
   * Gets an observable that is notified when the dialog is finished closing.
   */
  afterClosed(): Observable<any> {
    return this._afterClosed.asObservable();
  }

  /**
   * Gets an observable that is notified when the dialog has started closing.
   */
  beforeClose(): Observable<any> {
    return this._beforeClose.asObservable();
  }
}
