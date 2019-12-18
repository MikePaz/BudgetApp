//Budget controller

let budgetController = (function () {

    let Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    let Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    let calculateTotal = function (type) {
        let sum = 0;
        data.allItems[type].forEach(function (current) {
            sum += current.value;
            data.totals[type] = sum;
        });

    };

    //Custom Data structure
    let data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0,
        },
        budget: 0,
        percentage: -1

    };



    return {
        addItem: function (type, description, value) {
            let newItem, ID;

            //Create new ID
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }


            //Create new item based on inc or exp type
            if (type === 'exp') {
                newItem = new Expense(ID, description, value)
            } else if (type === 'inc') {
                newItem = new Income(ID, description, value)
            }

            //Push it into our data structure
            data.allItems[type].push(newItem);

            //Return the new element
            return newItem;
        },



        deleteItem: function (type, ID) {
            let ids, index
            
            ids = data.allItems[type].map(function (current) {
                return current.id;
            })

            index = ids.indexOf(ID)

            if(index !== -1) {
                data.allItems[type].splice(index , 1)
            }
        },

        calculateBudget: function () {
            // Calculate Total income and expenses

            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate the budget: income - expenses

            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that we spent

            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }


        },

        getBudget: function () {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },

        testing: function () {
            console.log(data)
        }
    };

})();


//UI controller
let UIController = (function () {

    let DOMStrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputButton: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        budgetIncomeValue: '.budget__income--value',
        budgetExpenseValue: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container'
    };

    return {

        getInput: function () {
            return {
                type: document.querySelector(DOMStrings.inputType).value,
                description: document.querySelector(DOMStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value)

            }
        },


        addListItem: function (obj, type) {
            let html, newHtml, element;
            // Create HTML string with placeholder
            if (type === "inc") {
                element = DOMStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div></div>'

            } else if (type === "exp") {
                element = DOMStrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'

            }

            // Replace the placeholder with data 

            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', obj.value);

            // Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem: function(selectorID){
            let element = document.getElementById(selectorID)

            element.parentNode.removeChild(element)
        },
        
        //QuerySelectorAll returns a list not an array
        clearFields: function () {
            let fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);

            //Using the prototype chain to take advantage of slice() of Array Object
            let fieldsArray = Array.prototype.slice.call(fields);

            fieldsArray.forEach(function (current, index, value) {
                current.value = "";
            });

            fieldsArray[0].focus();
        },

        displayBudget: function (obj) {
            document.querySelector(DOMStrings.budgetLabel).textContent = obj.budget;
            document.querySelector(DOMStrings.budgetIncomeValue).textContent = obj.totalInc;
            document.querySelector(DOMStrings.budgetExpenseValue).textContent = obj.totalExp;

            if (obj.percentage > 0) {
                document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + "%";
            } else {
                document.querySelector(DOMStrings.percentageLabel).textContent = '--'
            }


        },

        getDOMStrings: function () {
            return DOMStrings;
        }
    };

})();



// Global app controller


let controller = (function (budgetCtrl, UICtrl) {

    // Function that let us handle eventLisenters privately while we keep in check with DRY principle 
    let setupEventListeners = function () {
        let DOM = UICtrl.getDOMStrings();

        document.querySelector(DOM.inputButton).addEventListener('click', controllerAddItem)

        document.addEventListener('keypress', function (event) {
            if (event.keyCode === 13 || event.which === 13) {
                controllerAddItem();
            }
        });
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem)

    }

    let controllerAddItem = function () {

        let input, newItem

        //  1 Get the field input data
        input = UICtrl.getInput();

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {

            //  2 Add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            //  3 Add the new item to the user interface
            UICtrl.addListItem(newItem, input.type);

            // 4 Clear the fields
            UICtrl.clearFields();

            // 5 Calculate and Update Budget
            updateBudget();
        }
    }



    let ctrlDeleteItem = function (event) {
        let itemID, splitID, type, ID;
        itemID = (event.target.parentNode.parentNode.parentNode.parentNode.id)

        if (itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);

            //  Delete item from the dataStructure
            budgetCtrl.deleteItem(type , ID);

            // Delete the item from the UI
            UICtrl.deleteListItem(itemID)

            // Update and show the new budget
            updateBudget();

        }
    }

    let updateBudget = function () {
        // 1 Calculate Budget
        budgetCtrl.calculateBudget();

        // 2 Return the budget

        let budget = budgetCtrl.getBudget();

        // 3 Display the Budget on UI

        UICtrl.displayBudget(budget);

    }

    // Exposing init function to global scope
    return {
        init: function () {
            console.log('Application has started');
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: 0
            });
            setupEventListeners();
        }
    }




})(budgetController, UIController);

controller.init();