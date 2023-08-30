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

import {classNames, useIsMobileDevice} from '@react-spectrum/utils';
import {MenuContext, MenuDialogContext, useMenuStateContext} from './context';
import {Popover, Tray} from '@react-spectrum/overlays';
import React, {Key, ReactElement, useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/menu/vars.css';
import {useMenuTrigger} from '@react-aria/menu';
import {useMenuTriggerState} from '@react-stately/menu';

// TODO: Add shouldFlip and closeOnSelect if we feel like those should be customizable for SubMenuTrigger
// Other MenuTriggerProps like onOpenChange and positioning stuff have been removed as per discussion
interface SubMenuTriggerProps {
  /**
   * The contents of the SubMenuTrigger - a Item and a Menu.
   */
  children: ReactElement[],
  targetKey: Key
}

export interface SpectrumSubMenuTriggerProps extends Omit<SubMenuTriggerProps, 'targetKey'> {}
// TODO: Think about if it should reuse the same state MenuTrigger uses or use its own
// How to control it so that only one submenu can be open at once. At the moment we actually handle this via useMenuItem since it calls setExpandedKey with a single key on open
// and we don't allow isOpen/defaultOpen on SubMenus

// TODO: got rid of user provided ref support since it doesn't really make sense for submenus IMO
function SubMenuTrigger(props: SubMenuTriggerProps) {
  let triggerRef = useRef<HTMLLIElement>();
  let menuRef = useRef<HTMLUListElement>();
  let {
    children
  } = props;

  let [menuTrigger, menu] = React.Children.toArray(children);

  // TODO: Grab the tree state from the parent, each level of SubMenuTrigger has its own state tracking the
  // expanded state of its immediate children (aka each Menu has its own tree state) and thus enforce that only a single key on its level is open at a time.
  // Each SubMenuTrigger has its own open state enforced by the expandedKeys state of its parent trigger.
  let {state: parentMenuState, container, menu: parentMenu, topLevelMenuState} = useMenuStateContext();

  // TODO: call useMenuTriggerState in place of useOverlayTriggerState since they are basically the same except for focusStrategy which we need for SubMenu autofocus
  let subMenuState = useMenuTriggerState({isOpen: parentMenuState.expandedKeys.has(props.targetKey), onOpenChange: (val) => {
    if (!val) {
      if (parentMenuState.expandedKeys.has(props.targetKey)) {
        // TODO: hides menu, currenly triggered since hovering away causes focus to move out of the sub menu and triggers a close via useOverlay
        parentMenuState.toggleKey(props.targetKey);
      }
    }
  }});

  // TODO: For now sourcing the bare minimum from useMenuTrigger since useMenuItem handles submenu trigger interaction and aria-haspopup/aria-expanded
  // Some of those can be sourced from useMenuTrigger (aria-expanded, etc) and/or provided by the hook via modifications (perhaps the press/keyboard/hover interactions)
  // but to be discussed/revisited. The main issue is that useMenuItem doesn't accept press props or DOMProps so it makes moving the submenu trigger interactions code into useMenuTrigger awkward since
  // useMenuTrigger assumes something like useButton will consume the props it provides and thus only provides the press props for usePress consumption.
  // TODO: also can grab aria-controls from useMenu, but unsure if needed (don't need subMenuId either if so). Test with and without it
  // Doesn't seem to have a noticeable effect on the announcements
  let {menuTriggerProps, menuProps} = useMenuTrigger({trigger: 'press', isDisabled: parentMenuState.disabledKeys.has(props.targetKey)}, subMenuState, triggerRef);
  // TODO: just dd all of the menuTriggerProps here to the context
  let {id, 'aria-controls': ariaControls} = menuTriggerProps;

  let onExit = () => {
    // if focus was already moved back to a menu item, don't need to do anything
    if (!parentMenu.current.contains(document.activeElement)) {
      // need to return focus to the trigger because hitting Esc causes focus to go to the subdialog, which is then unmounted
      // this leads to blur never being fired nor focus on the body
      triggerRef.current.focus();
    }
  };

  let isMobile = useIsMobileDevice();
  let menuContext = {
    ...menuProps,
    ref: menuRef,
    // Selecting a menu item in a sub menu should also close ALL menus, so we close the root menu instead of just the submenu.
    // Overrides menuProps.onClose
    // TODO: onOpenChange for submenus won't trigger when onClose here is called since we are only closing the root menu, should
    // we chain calls for all the submenus as well? Not even sure of the use case for having onOpenChange or onOpen for submenus
    onClose: topLevelMenuState.close,
    // Separate handler for useMenuItem, used to close just the submenu when the user presses ArrowLeft in a submenu
    onSubMenuClose: menuProps.onClose,
    // TODO:useMenuItem currently handles opening the submenu, perhaps copy over the pressProps/some of the keydown stuff from useMenuTrigger's implementation
    // and move it to a useSubMenuTrigger hook or modify useMenuTrigger so it can distingush between the typical menuTrigger stuff. Problem is that useMenuItem doesn't
    // accept pressProps or dom attributes...
    // For now pass it into the hook via contexts and weak maps, but ideally I think useMenuTrigger should handle creating the bulk of the interaction handlers + aria attributes and
    // that stuff would get provided to useMenuItem to be processed?
    UNSAFE_style: isMobile ? {
      width: '100%',
      maxHeight: 'inherit'
    } : undefined,
    UNSAFE_className: classNames(styles, {'spectrum-Menu-popover': !isMobile})
  };


  let overlay;
  // TODO: handle tray experience later
  if (isMobile) {
    overlay = (
      <Tray state={subMenuState}>
        {menu}
      </Tray>
    );
  } else {
    overlay = (
      <Popover
        // Props from ContextualHelpTrigger implementation
        onExit={onExit}
        // TODO Omitted onBlurWithin, doesn't seem like it was necessary?
        container={container.current}
        // TODO: for now placement is customizable by user as per discussion, still need offset
        // will need to test all the combinations
        offset={-10}
        isNonModal
        enableBothDismissButtons
        disableFocusManagement

        // Props from MenuTriggerImplementation
        UNSAFE_style={{clipPath: 'unset'}}
        state={subMenuState}
        triggerRef={triggerRef}
        scrollRef={menuRef}
        placement="end top"
        hideArrow>
        {menu}
      </Popover>
    );
  }

  let openSubMenu = (focusStrategy) => {
    // TODO: call setExpandedKeys here or just do it in useMenuItem?
    // parentMenuState.setExpandedKeys()
    subMenuState.open(focusStrategy);
  };

  return (
    <>
      {/* TODO rename MenuDialogContext to something more generic */}
      <MenuDialogContext.Provider value={{triggerRef, openSubMenu, id, 'aria-controls': ariaControls}}>{menuTrigger}</MenuDialogContext.Provider>
      <MenuContext.Provider value={menuContext}>
        {overlay}
      </MenuContext.Provider>
    </>
  );
}

SubMenuTrigger.getCollectionNode = function* (props: SpectrumSubMenuTriggerProps) {
  // React.Children.toArray mutates the Item's key which is problematic for user provided keys
  // TODO: perhaps make this same change in ContextualHelpTrigger too
  let childArray: ReactElement[] = [];
  React.Children.forEach(props.children, child => {
    if (React.isValidElement(child)) {
      childArray.push(child);
    }
  });
  let [trigger] = childArray;
  let [, content] = props.children as [ReactElement, ReactElement];

  yield {
    element: React.cloneElement(trigger, {...trigger.props, hasChildItems: true, isTrigger: true}),
    wrapper: (element) => (
      <SubMenuTrigger key={element.key} targetKey={element.key} {...props}>
        {element}
        {content}
      </SubMenuTrigger>
    )
  };
};

let _SubMenuTrigger = SubMenuTrigger as (props: SpectrumSubMenuTriggerProps) => JSX.Element;
export {_SubMenuTrigger as SubMenuTrigger};