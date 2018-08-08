import React, { PureComponent } from 'react';
import { findDOMNode } from 'react-dom';
import T from 'prop-types';
import cn from 'classnames';

import { TooltipContext } from './TooltipTrigger';
import { renderSlot } from './utils';
import { TransitionedPopperBox, Arrow } from './TooltipTriggerComponents';

const MUTATION_OBSERVER_CONFIG = {
  childList: true,
  subtree: true
};

/**
 * @private
 */
export default class Tooltip extends PureComponent {
  static propTypes = {
    innerRef: T.func,
    style: T.object,
    showArrow: T.bool,
    arrowProps: T.object,
    placement: T.string,
    trigger: T.string,
    clearScheduled: T.func,
    scheduleHide: T.func,
    tooltipClassName: T.string,
    tooltipStyle: T.object,
    tooltip: T.node,
    hideTooltip: T.func,
    parentOutsideClickHandler: T.func,
    scheduleUpdate: T.func,
    removeParentOutsideClickHandler: T.func,
    addParentOutsideClickHandler: T.func,
    closeOnOutOfBoundaries: T.bool,
    outOfBoundaries: T.bool
  };

  _handleOutsideClick = e => {
    if (!findDOMNode(this).contains(e.target)) {
      const {
        hideTooltip,
        clearScheduled,
        parentOutsideClickHandler
      } = this.props;

      clearScheduled();
      hideTooltip();
      parentOutsideClickHandler && parentOutsideClickHandler(e);
    }
  };

  _addOutsideClickHandler = () =>
    document.addEventListener('click', this._handleOutsideClick);

  _removeOutsideClickHandler = () =>
    document.removeEventListener('click', this._handleOutsideClick);

  componentDidMount() {
    const { trigger } = this.props;
    const observer = (this.observer = new MutationObserver(() => {
      this.props.scheduleUpdate();
    }));
    observer.observe(findDOMNode(this), MUTATION_OBSERVER_CONFIG);

    if (trigger === 'click' || trigger === 'right-click') {
      const { removeParentOutsideClickHandler } = this.props;
      document.addEventListener('click', this._handleOutsideClick);
      removeParentOutsideClickHandler && removeParentOutsideClickHandler();
    }
  }

  componentWillUnmount() {
    const { trigger } = this.props;
    this.observer.disconnect();

    if (trigger === 'click' || trigger === 'right-click') {
      const { addParentOutsideClickHandler } = this.props;
      document.removeEventListener('click', this._handleOutsideClick);
      addParentOutsideClickHandler && addParentOutsideClickHandler();
    }
  }

  componentDidUpdate() {
    if (this.props.closeOnOutOfBoundaries && this.props.outOfBoundaries) {
      this.props.hideTooltip();
    }
  }

  render() {
    const {
      innerRef,
      style,
      showArrow,
      arrowProps,
      placement,
      trigger,
      clearScheduled,
      scheduleHide,
      tooltipClassName,
      tooltipStyle,
      tooltip
    } = this.props;

    const isHoverTriggered = trigger === 'hover';

    const eventHandlers = {
      onMouseEnter: isHoverTriggered ? clearScheduled : undefined,
      onMouseLeave: isHoverTriggered ? scheduleHide : undefined
    };

    return (
      <TransitionedPopperBox
        className="tooltip"
        innerRef={innerRef}
        style={style}
      >
        {showArrow && (
          <Arrow
            innerRef={arrowProps.ref}
            data-placement={placement}
            style={arrowProps.style}
          />
        )}
        <span
          className={cn('tooltip-body', tooltipClassName)}
          style={tooltipStyle}
          {...eventHandlers}
        >
          <TooltipContext.Provider
            value={{
              addParentOutsideClickHandler: this._addOutsideClickHandler,
              removeParentOutsideClickHandler: this._removeOutsideClickHandler,
              parentOutsideClickHandler: this._handleOutsideClick
            }}
          >
            {renderSlot(tooltip)}
          </TooltipContext.Provider>
        </span>
      </TransitionedPopperBox>
    );
  }
}