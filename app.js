const axios = require('axios');
const _ = require('underscore');

const baseURL = 'https://backend-challenge-summer-2018.herokuapp.com/challenges.json?id=1&page=';
//const baseURL = 'https://backend-challenge-summer-2018.herokuapp.com/challenges.json?id=2&page=';


class Tree {   

    constructor(rootNode) {
        this._rootNode = rootNode;
        this._rootNode.makeRoot();
    }
      
    getRoot() {
        return this._rootNode;
    }

    getRootChildrenSorted() {
        let myChildren = [];
        this.recordChildrenIDs(this._rootNode.getLeftmostChild(), myChildren);
        return _.sortBy(myChildren);
    }

    recordChildrenIDs(node, array) {
        if(node === null) return;
        array.push(node.getID());
        this.recordChildrenIDs(node.getLeftmostChild(), array);
        this.recordChildrenIDs(node.getRightSibling(), array);
    }



    preOrderPrint() {
        this.startPrinting(this._rootNode);
    }

    startPrinting(node) {
        if(node === null) return;
        console.log(node.getID());
        this.startPrinting(node.getLeftmostChild());
        this.startPrinting(node.getRightSibling());
    }

    isValid() {
        return this.startValidating(this._rootNode);
    }

    startValidating(node) {
        if(node === null)  return true;
        let hasAns = node.hasAncestor(node.getID());
        if(node.hasAncestor(node.getID()))  return false;
        let checkLeft = this.startValidating(node.getLeftmostChild());
        let checkRight = this.startValidating(node.getRightSibling());
        if(checkLeft === false || checkRight === false) return false;
        return true;
    }

    findNodeWithID(id) {
        return this.findNode(this._rootNode, id);
    }

    findNode(node,id) {
        if(node === null) return null;
        if(node.getID() === id) {return node};
        let checkLeft =  this.findNode(node.getLeftmostChild(), id);
        let checkRight = this.findNode(node.getRightSibling(), id);
        if(checkLeft !== null) {
            return checkLeft;
        } else {
            return checkRight;
        }
    }
}


class TreeNode {
    
    constructor(id) {
        this._id = id;
        this._parent = null;
        this._isRoot = false;
        this._leftmostChild = null;
        this._rightSibling = null;
    }

   addChild(childNode) {
       childNode._parent = this;
       if(this._leftmostChild === null) {
           this._leftmostChild = childNode;
       } else {
           let current = this._leftmostChild;
           while(current._rightSibling !== null) {
               current = current._rightSibling;
           }
           current._rightSibling = childNode;
       }
   }

   getChildWithID(id) {
       let current = this._leftmostChild;
       while(current && current._id !== id) {
           current = current._rightSibling;
       }
       return current;
   }

    hasAncestor(ancestorID) {
        let current = this._parent;
        while(current !== null) {
            if(current._id === ancestorID) {
                return true;
            }
            current = current._parent;
        }
        return false;
    }

   getParent() {
       return this._parent;
   }

   getRightSibling() {
       return this._rightSibling;
   }

   getLeftmostChild() {
       return this._leftmostChild;
   }

   getID() {
       return this._id;
   }

   makeRoot() {
       this._isRoot = true;
   }  
}


const menus = [];
const promiseArray = [];
const trees = [];
const validTrees = [];
const invalidTrees = [];
const validMenus = [];
const invalidMenus = [];

makeInitialRequest = () => {
    return new Promise( (resolve, reject) => {
        let initialResponsePromise = axios.get(baseURL + 1)
        .then(response => {
            const total = response.data.pagination.total;
            const perPage = response.data.pagination.per_page;
            const numRequests = Math.ceil(total/perPage);
            makeRequests(numRequests);
        });
        resolve(initialResponsePromise);
    });
}

makeRequests = numRequests => {
    for(let i=1; i<=numRequests; i++) {
        let axiosPromise = axios.get(baseURL + i);
        promiseArray.push(axiosPromise);
    }
}

createChildren = (parentNode, childrenIDArray) => {
    childrenIDArray.forEach(childID => {
        let childNode = new TreeNode(childID);
        parentNode.addChild(childNode);
    });
}


buildTrees = () => {
    menus.forEach(menu=> {
        if(!menu.parent_id) {
            let root = new TreeNode(menu.id);
            let tree = new Tree(root);
            trees.push(tree);
            createChildren(root, menu.child_ids);
        } else {
            let parent = findNode(menu.parent_id);
            if(parent) {
                let node = parent.getChildWithID(menu.id);
                createChildren(node, menu.child_ids);
            }
        }
    })
}

findNode = id => {
    for(let i=0; i<trees.length; i++) {
        let temp = trees[i].findNodeWithID(id);
        if(temp) return temp;
    }
    return null;
}

validateTrees = () => {
    trees.forEach(tree=> {
        if(tree.isValid()) {
            validTrees.push(tree);
        } else {
            invalidTrees.push(tree);
        }
    })
}


recordTreeAsMenu = (menuArray, treeArray) => {
    treeArray.forEach(tree => {
        let menu = {
            root_id: tree.getRoot().getID(),
            children: tree.getRootChildrenSorted()
        }
        menuArray.push(menu);
    });
}

validateMenus = () => {
    buildTrees(); 
    validateTrees();
    recordTreeAsMenu(validMenus, validTrees);
    recordTreeAsMenu(invalidMenus, invalidTrees);
    let result = {
        valid_menus: validMenus,
        invalid_menus: invalidMenus
    }
    console.log(result);
}

makeInitialRequest()
    .then( () => {
        Promise.all(promiseArray)
            .then(responseArray=> {
                responseArray.forEach(response => {
                    menus.push(...response.data.menus);
                })
                validateMenus();
            })
            .catch(error=> {
                console.log("ERROR: ", error);
            })
    });

    