import { helper } from '@ember/component/helper';

import { jsxs as _jsxs } from 'react/jsx-runtime';

export default helper(function jsxs(attrs: Parameters<typeof _jsxs>) {
  return _jsxs(...attrs);
});
