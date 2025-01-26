import { helper } from '@ember/component/helper';

import { jsx as _jsx } from 'react/jsx-runtime';

export default helper(function jsx(attrs: Parameters<typeof _jsx>) {
  return _jsx(...attrs);
});
