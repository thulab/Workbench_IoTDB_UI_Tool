// @ts-nocheck
/* eslint-disable default-case */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable import/no-named-default */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */

import { isEqual } from 'lodash-unified';
import type { Nullable } from '@element-plus/es/utils/index';
import Node from 'element-plus/es/components/cascader-panel/src/node';

import type {
  CascaderConfig,
  CascaderNodePathValue,
  CascaderNodeValue,
  CascaderOption,
} from 'element-plus/es/components/cascader-panel/src/node';

const flatNodes = (nodes: Node[], leafOnly: boolean) => nodes.reduce((res, node) => {
  if (node.isLeaf) {
    res.push(node);
  } else {
    !leafOnly && res.push(node);
    res = res.concat(flatNodes(node.children, leafOnly));
  }
  return res;
}, [] as Node[]);

export default class Store {
  readonly nodes: Node[];

  readonly allNodes: Node[];

  readonly leafNodes: Node[];

  constructor(data: CascaderOption[], readonly config: CascaderConfig) {
    const nodes = (data || []).map(
      (nodeData) => new Node(nodeData, this.config),
    );
    this.nodes = nodes;
    this.allNodes = flatNodes(nodes, false);
    this.leafNodes = flatNodes(nodes, true);
  }

  getNodes() {
    return this.nodes;
  }

  getFlattedNodes(leafOnly: boolean) {
    return leafOnly ? this.leafNodes : this.allNodes;
  }

  appendNode(nodeData: CascaderOption, parentNode?: Node) {
    const node = parentNode
      ? parentNode.appendChild(nodeData)
      : new Node(nodeData, this.config);

    if (!parentNode) this.nodes.push(node);

    this.allNodes.push(node);
    node.isLeaf && this.leafNodes.push(node);
  }

  // eslint-disable-next-line class-methods-use-this
  cleanChildNodes(parentNode: Node) {
    parentNode.children.length = 0;
    parentNode.childrenData.length = 0;
  }

  appendNodes(nodeDataList: CascaderOption[], parentNode: Node) {
    nodeDataList.forEach((nodeData) => this.appendNode(nodeData, parentNode));
  }

  // when checkStrictly, leaf node first
  getNodeByValue(
    value: CascaderNodeValue | CascaderNodePathValue,
    leafOnly = false,
  ): Nullable<Node> {
    if (!value && value !== 0) return null;

    const node = this.getFlattedNodes(leafOnly).find(
      (nodeItem) => isEqual(nodeItem.value, value) || isEqual(nodeItem.pathValues, value),
    );

    return node || null;
  }

  getSameNode(node: Node): Nullable<Node> {
    if (!node) return null;

    const node_ = this.getFlattedNodes(false).find(
      ({ value, level }) => isEqual(node.value, value) && node.level === level,
    );

    return node_ || null;
  }
}
