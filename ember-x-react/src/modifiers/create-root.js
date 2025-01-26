import { registerDestructor } from '@ember/destroyable';
import { getOwner } from '@ember/application';

import { isTesting, macroCondition } from '@embroider/macros';
import Modifier from 'ember-modifier';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

function cleanup(instance) {
  if (macroCondition(isTesting())) {
    act(() => {
      instance.root?.unmount();
    });
  } else {
    instance.root?.unmount();
  }
}

export default class CreateRootModifier extends Modifier {
  owner = getOwner(this);

  modify(element, [positional]) {
    if (!this.root) {
      this.root = createRoot(element);
      registerDestructor(this, cleanup);
    }

    if (!positional) {
      return;
    }

    if (macroCondition(isTesting())) {
      act(() => {
        this.root?.render(positional.children);
      });
    } else {
      this.root.render(positional.children);
    }
  }
}
