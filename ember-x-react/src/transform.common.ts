import type { Transform } from 'babel-plugin-ember-template-compilation';
import type { NodeVisitor, ASTv1 } from '@glimmer/syntax';

export const transform: Transform = (env) => {
  const b = env.syntax.builders;

  function isXReact(node: ASTv1.Node) {
    return node.type === 'ElementNode' && node.tag === 'XReact';
  }

  function isXReactRoot(node: ASTv1.Node) {
    return node.type === 'ElementNode' && node.tag === 'XReact::Root';
  }

  function isHtmlElement(node: ASTv1.Node) {
    return (
      node.type === 'ElementNode' &&
      !isXReact(node) &&
      node.tag[0] &&
      /^[a-z]/.test(node.tag[0])
    );
  }

  function findAttribute(node: ASTv1.ElementNode, name: string) {
    return node.attributes.find((attr) => attr.name === name);
  }

  function attributeNameToReact(attrName: string) {
    if (attrName === 'class') return 'className';
    if (attrName === 'readonly') return 'readOnly';
    // todo: add more attribute name conversions

    return attrName;
  }

  function transformAttributeValue(attrValue: ASTv1.AttrNode['value']) {
    if (attrValue.type === 'TextNode') {
      return b.string(attrValue.chars);
    }

    if (attrValue.type === 'MustacheStatement') {
      if (attrValue.params.length === 0) {
        return attrValue.path;
      }
      return b.sexpr(attrValue.path, attrValue.params, attrValue.hash);
    }

    throw new Error('Unsupported attribute value type: ' + attrValue.type);
  }

  function convertAttributesToHash(attributes: ASTv1.AttrNode[]) {
    const pairs = attributes.map((attr) => {
      return b.pair(
        attributeNameToReact(attr.name),
        transformAttributeValue(attr.value),
      );
    });
    return b.hash(pairs);
  }

  function buildReactHelper(
    tagOrComponent: ASTv1.PathExpression | ASTv1.StringLiteral,
    propsHash: ASTv1.Hash,
    children: ReturnType<typeof collectChildComponents> = [],
  ) {
    const params: ASTv1.Expression[] = [tagOrComponent];
    if (propsHash || children.length > 0) {
      const childContent =
        children.length === 1 && children[0]
          ? children[0]
          : b.sexpr(b.path('array'), children);

      const pairs =
        children.length > 0 ? [b.pair('children', childContent)] : [];

      if (propsHash) {
        pairs.push(...propsHash.pairs);
      }

      const combinedHash = b.sexpr(b.path('hash'), undefined, b.hash(pairs));
      params.push(combinedHash);
    }
    return b.sexpr(b.path(children.length > 1 ? 'jsxs' : 'jsx'), params);
  }

  function transformIfStatement(
    block: ASTv1.BlockStatement,
  ): ASTv1.SubExpression | null {
    // apparently it's valid to just write {{#if}} without any condition
    if (!block.params[0]) {
      return null;
    }

    const condition = block.params[0];
    const truthyChildren = collectChildComponents(block.program.body);

    const params = [condition, ...truthyChildren];

    if (block.inverse) {
      const falsyChildren = collectChildComponents(block.inverse.body);
      params.push(...falsyChildren);
    }

    return b.sexpr(b.path('if'), params);
  }

  /** @TODO narrow down return type? */
  function collectChildComponents(
    children: ASTv1.ElementNode['children'],
  ): ASTv1.Expression[] {
    return children
      .map((child) => {
        // Handle TextNodes
        if (child.type === 'TextNode') {
          if (child.chars.trim() === '') return null; // Ignore whitespace-only TextNodes

          /**
           * This trimming seems to be only necessary
           * when targetFormat is hbs instead of wire
           * */
          const leadingWhiteSpace = /^[ \t\r\n]+/;
          const trailingWhiteSpace = /[ \t\r\n]+$/;

          return b.string(
            child.chars
              .replace(leadingWhiteSpace, ' ')
              .replace(trailingWhiteSpace, ' '),
          );
        }

        // Handle Mustache Expressions
        if (child.type === 'MustacheStatement') {
          /**
           * @TODO: investigate why paths are typed as expression instead of pathexpression
           * then delete all the type assertions
           * */
          if (
            child.path.type === 'PathExpression' &&
            child.path.original === 'yield'
          ) {
            throw new Error(
              'The yield keyword is not supported inside XReact components',
            );
          }
          if (child.params.length === 0) {
            return child.path;
          }
          return b.sexpr(child.path, child.params, child.hash);
        }

        // Handle BlockStatements (e.g., {{#if ...}} and {{else}})
        if (child.type === 'BlockStatement') {
          if (
            child.path.type === 'PathExpression' &&
            child.path.original === 'if'
          ) {
            return transformIfStatement(child);
          }
          // @TODO handle other block statements
          return null;
        }

        if (
          child.type === 'CommentStatement' ||
          child.type === 'MustacheCommentStatement' ||
          child.type === 'PartialStatement'
        ) {
          /** @TODO not sure yet for the partial one */
          return null;
        }

        // Handle ReactBridge Nodes
        if (isXReact(child)) {
          const reactComponentAttr = findAttribute(child, '@component');
          if (
            !reactComponentAttr ||
            reactComponentAttr.value.type !== 'MustacheStatement' ||
            reactComponentAttr.value.path.type !== 'PathExpression'
          )
            return null;

          const reactComponent = reactComponentAttr.value.path.original;

          const childProps = findAttribute(child, '@props');

          if (childProps?.value.type !== 'MustacheStatement') {
            throw new Error(
              'The @props attribute must be a mustache statement',
            );
          }

          const nestedChildren = collectChildComponents(child.children);

          return buildReactHelper(
            b.path(reactComponent),
            childProps?.value?.hash,
            nestedChildren,
          );
        }

        // Handle HTML Elements
        if (isHtmlElement(child)) {
          const tagName = child.tag;
          const attributesHash = convertAttributesToHash(child.attributes);
          const nestedChildren = collectChildComponents(child.children);

          return buildReactHelper(
            b.string(tagName),
            attributesHash,
            nestedChildren,
          );
        }

        return null;
      })
      .filter((child) => child !== null);
  }

  /** Not sure how collectChildElement return type will evolve so just using returnType for now */
  function updatePropsAttribute(
    node: ASTv1.ElementNode,
    childrenElements: ReturnType<typeof collectChildComponents>,
  ) {
    const childContent =
      childrenElements.length === 1 && childrenElements[0]
        ? childrenElements[0]
        : b.sexpr(b.path('array'), childrenElements);
    const propsAttr = findAttribute(node, '@props');

    if (propsAttr && propsAttr.value.type === 'MustacheStatement') {
      propsAttr.value.hash.pairs.push(b.pair('children', childContent));
    } else {
      const propsMustache = b.mustache(
        b.path('hash'),
        undefined,
        b.hash([b.pair('children', childContent)]),
      );
      node.attributes.push(b.attr('@props', propsMustache));
    }
  }

  const visitor: NodeVisitor = {
    ElementNode(node) {
      if (!isXReactRoot(node)) return;

      const childrenElements = collectChildComponents(node.children);

      if (childrenElements.length > 0) {
        updatePropsAttribute(node, childrenElements);
        node.children = [];
        node.selfClosing = true;
      }
    },
  };

  return {
    name: 'ember-x-react-plugin',
    visitor,
  };
};
