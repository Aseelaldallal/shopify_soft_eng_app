let axios = require('axios');
const Tree = require('./Tree.js');
const TreeNode = require('./TreeNode.js');

const baseURL = 'https://backend-challenge-summer-2018.herokuapp.com/challenges.json?id=1&page=';
//const baseURL = 'https://backend-challenge-summer-2018.herokuapp.com/challenges.json?id=2&page=';

// things to do:
// package .json add start 
// remove initial thingy thing
// add catch thingy things

const menus = [];
const promiseArray = [];
const trees = [];
const validTrees = [];
const invalidTrees = [];
const validMenus = [];
const invalidMenus = [];

makeInitialRequest = () => {
    return new Promise( (resolve, reject) => {
        axios.get(baseURL + 1)
        .then(response => {
            const total = response.data.pagination.total;
            const perPage = response.data.pagination.per_page;
            const numRequests = Math.ceil(total/perPage);
            makeRequests(numRequests);
        })
        .catch(error => {
            console.log(error.message);
            reject(error);
        });
        resolve();
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
    })
    .catch;
