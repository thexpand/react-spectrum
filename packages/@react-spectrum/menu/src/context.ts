/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {DOMProps, FocusStrategy, HoverEvents, KeyboardEvents, PressEvents} from '@react-types/shared';
import {MenuTriggerState} from '@react-stately/menu';
import React, {HTMLAttributes, MutableRefObject, RefObject, useContext} from 'react';
import {TreeState} from '@react-stately/tree';

export interface MenuContextValue extends Omit<HTMLAttributes<HTMLElement>, 'autoFocus'> {
  onClose?: () => void,
  closeOnSelect?: boolean,
  shouldFocusWrap?: boolean,
  autoFocus?: boolean | FocusStrategy,
  ref?: MutableRefObject<HTMLUListElement>,
  state?: MenuTriggerState,
  onSubMenuClose?: () => void,
  // TODO: update this type when I add hook for initializing this state
  menuTreeState?: {
    expandedKeysStack: string[],
    setExpandedKeysStack,
    closeAll,
    openSubMenu,
    closeSubMenu
  }
}

export const MenuContext = React.createContext<MenuContextValue>({});

export function useMenuContext(): MenuContextValue {
  return useContext(MenuContext);
}

export interface MenuDialogContextValue extends DOMProps, Pick<PressEvents, 'onPressStart' | 'onPress'>, Pick<HoverEvents, 'onHoverChange'>, Pick<KeyboardEvents, 'onKeyDown'> {
  isUnavailable?: boolean,
  triggerRef?: MutableRefObject<HTMLLIElement>,
  'aria-controls'?: string,
  'aria-haspopup'?: string,
  'aria-expanded'?: string
}

export const MenuDialogContext = React.createContext<MenuDialogContextValue | undefined>(undefined);

export function useMenuDialogContext(): MenuDialogContextValue {
  return useContext(MenuDialogContext);
}

export interface MenuStateContextValue<T> {
  state?: TreeState<T>,
  container?: RefObject<HTMLElement>,
  menu?: RefObject<HTMLUListElement>,
  // TODO: update this type
  menuTreeState?: {
    expandedKeysStack: string[],
    setExpandedKeysStack,
    closeAll,
    openSubMenu,
    closeSubMenu
  }
}

export const MenuStateContext = React.createContext<MenuStateContextValue<any>>(undefined);

export function useMenuStateContext<T>(): MenuStateContextValue<T> {
  return useContext(MenuStateContext);
}
