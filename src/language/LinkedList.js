class _Node {
  constructor(value, next) {
    this.value = value;
    this.next = next;
  }
}

class LinkedList {
  constructor(user_id, id, total_score = 0) {
    this.user_id = user_id;
    this.id = id;
    this.total_score = total_score;
    this.head = null;
  }
  insertFirst(item) {
    this.head = new _Node(item, this.head);
  }

  insertLast(item) {
    if (this.head === null) {
      this.insertFirst(item);
    } else {
      let tempNode = this.head;
      while (tempNode.next !== null) {
        tempNode = tempNode.next;
      }
      tempNode.next = new _Node(item, null);
    }
  }

  relocateHead(memoryValue) {
    let tempNode = this.head.next;
    let beforeNode = this._findNthElement(memoryValue);
    this.head.next = beforeNode.next;
    beforeNode.next = this.head;
    this.head = tempNode;
    return [beforeNode, beforeNode.next];
  }

  _findNthElement(position) {
    let node = this.head;
    for (let i = 0; i < position; i++) {
      node = node.next;
    }
    return node;
  }

  forEach(cb) {
    let node = this.head;
    const arr = [];
    while (node) {
      arr.push(cb(node));
      node = node.next;
    }
    return arr;
  }

  size(list) {
    let nodeCounter = 1;
    if (list.head === null) {
      return console.log('Empty list');
    }
    let currentNode = list.head;
    while (currentNode.next !== null) {
      currentNode = currentNode.next;
      nodeCounter++;
    }
    return nodeCounter;
  }
}

module.exports = LinkedList;