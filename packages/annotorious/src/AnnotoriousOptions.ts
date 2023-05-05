export interface AnnotoriousOptions {

  keyboardCommands?: boolean;

  pointerSelection?: SelectAction;

  readOnly?: boolean;

  style?: Style;

}

export enum SelectAction {

  /** Hightlight the annotation target, if selected **/
  HIGHLIGHT = 'HIGHLIGHT',

  /** Make editable (will fail if locked) **/
  EDIT = 'EDIT',

  /** Make editable if available, highlight if locked **/
  EDIT_AND_HIGHLIGHT_IF_LOCKED = 'EDIT_AND_HIGHLIGHT_IF_LOCKED',

  /** No action **/
  NONE = 'NONE'

}

export interface Style {

  fill?: string 

  fillOpacity?: number 

  stroke?: string

  strokeOpacity?: number
  
}

export const fillDefaults = (opts: AnnotoriousOptions): AnnotoriousOptions => ({

  ...opts,

  keyboardCommands: opts.keyboardCommands === undefined ? true : opts.keyboardCommands,

  pointerSelection: opts.pointerSelection || SelectAction.EDIT_AND_HIGHLIGHT_IF_LOCKED

})