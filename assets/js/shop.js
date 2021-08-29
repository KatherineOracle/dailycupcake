$(function() {

    //ititiate all the objects requred for the shop
    let alerts = new Alerts();
    let allcupcakes = new Cupcakes();
    let reviews = new Reviews();
    let cart = new Cart();

    //build the elements, but check that the containers we need exist first
    if ($("#soldOut").length > 0) {
        allcupcakes.soldOut('#soldOut');
    }
    if ($("#hallFame").length > 0) {
        allcupcakes.hallofFame('#hallFame');
    }
    if ($("#dailyCupcake").length > 0) {
        allcupcakes.heroBanner("#dailyCupcake");
    }
    if ($("#orderNow").length > 0) {
        allcupcakes.fullPage("#orderNow");
    }
    if ($("#reviews").length > 0) {
        reviews.buildReviews("#reviews");
    }
    if ($("#alerts").length > 0) {
        alerts.buildList("#alerts", allcupcakes);
    }
    if ($("#cart").length > 0) {
        cart.buildList("#cart", allcupcakes);
    }
    $('[data-alerts-count]').html(alerts.total);
    $('[data-cart-count]').html(cart.total);

    /*Add jquery event listeneres to links and buttons because
     I'm adding these dynamically we find these elements in 
     jquery by using $(document)... 
    */
    // when clicking add a review button, call function to get the form in the offcanvas element
    $(document).on('click', '[data-review]', function() {
        const ccId = $(this).data('review');
        prepReviewForm(ccId, allcupcakes);
    });

    // when clicking an alert button, do the following:
    // update the alert object on/off 
    // toggle the class and title, reset the bootstrap tooltip
    // call the notification show function to alert user of change in number of alerts  
    $(document).on('click', '[data-alert]', function() {
        const ccId = $(this).data('alert');
        let result = alerts.toggle(ccId);
        if (result) {
            $('[data-alert=' + ccId + ']').addClass('active');
            notificationShow($('[data-alerts-for=' + ccId + ']'), "success", `Alert added. You have ${alerts.total} active alerts`);
            $('[data-alert=' + ccId + ']').html('Remove alert')
            $('[data-alert=' + ccId + ']').attr('title', 'Remove cupcake alert');
        } else {
            $('[data-alert=' + ccId + ']').removeClass('active');
            notificationShow($('[data-alerts-for=' + ccId + ']'), "success", `Alert removed. You have ${alerts.total} active alerts`);
            $('[data-alert=' + ccId + ']').attr('title', 'Get cupcake alert');
        }
        $('[data-alert=' + ccId + ']').tooltip('dispose');

        //if we are on our alerts page, remove the whole cupcake parent from the list
        // by fading it out with super cool animation chaining 
        if ($('#alerts').has($(this)).length) {
            $(this).closest('li').fadeOut(500, function(e) {
                $(this).closest('li').remove();
            });
        }
        $('[data-alerts-count]').html(alerts.total);
    });

    /*event for submitting a review
     add another review to the reviews object 
     clear the form and close the bs offcanvas component  
     in real life we would submit the review to the server  */
    $('#formReview').on('submit', function(e) {
        let form = document.querySelector('#' + this.id);

        if (form.checkValidity()) {
            const data = new FormData(e.target);
            let newReview = {
                "cupcakeid": parseInt(data.get('cupcakeid')),
                "rating": data.get('rating'),
                "userid": "-1",
                "date": +new Date(),
                "comments": data.get('comments')
            }
            reviews.addNew(newReview);
            reviews.buildReviews("#reviews");
            $(this).closest('.offcanvas').offcanvas('hide');

            $(this).trigger('reset');
        }
        form.classList.add('was-validated');
    });

    /*event for submitting an order - adds item to cart 
    then sends user to the cart page to confirm checkout
    */
    $(document).on('submit', '#formOrder', function(e) {
        const data = {
            id: parseInt($('[name=id]').val()),
            quantity: parseInt($('[name=quantity]').val())
        }
        cart.addItem(data);
        window.location.href = "cart.html"
    });

    /*event for changing the item quantity on the cart page 
    a data property that holds the value of the input box before the change
    at change we calculate the difference and update the quantity and ZAR total
    the update the data property ready for the next change.
    */
    $(document).on('change', '[data-qty-for]', function() {
        const ccId = $(this).data('qty-for');
        const newVal = $(this).val();
        const prevValue = $(this).data("prev-value");
        const toAdd = newVal - prevValue;
        cart.updateItem(ccId, toAdd);
        if ($("#cart").length > 0) {
            cart.buildList("#cart", allcupcakes);
        }
        $(this).attr("data-prev-value", newVal);
    });

    //the function that shows the tiny message below the alert toggle buttons.
    function notificationShow(el, type, message) {
        let classes = "alert alert-" + type;
        if (el.length > 0) {
            el.html(message).addClass(classes).fadeTo(500, 1, function() {
                el.delay(3000).fadeTo(500, 0, function() {
                    el.removeClass(classes).empty()
                });
            });
        }
    }

    //the function that prepares the review form for the required cupcake.    
    function prepReviewForm(ccId, allcupcakes) {
        let cctitle = allcupcakes.findItem(ccId).title;
        $('#formReview').removeClass('was-validated');
        $('.cupcakeReviewTitle').html(cctitle);
        $('[name=cupcakeid]').val(ccId);
        $('input[type="radio"]').prop('checked', false);
    }

    //the constructor to manage our list of reviews    
    function Reviews() {
        'use strict';
        //initialise list to what is in session storage, might be null, thats also ok.
        this.list = JSON.parse(sessionStorage.getItem("reviews"));

        //here we save any updates to our review list and to storage
        this.toStorage = function(data) {
            this.list = data;
            sessionStorage.setItem("reviews", JSON.stringify(data));
        }

        //Check if the list is null, if so get from the 'database' using ajax. 
        //As Ajax is asyncronise we wrap it all in a promise so that functions
        //that call this must wait for the promise to resolve     
        this.getList = function() {
            let obj = this;
            let reviewPromise = new Promise(function(resolve, reject) {
                if (obj.list != null && typeof(obj.list) != 'undefined') {
                    resolve(true)
                } else {
                    $.get("assets/data/reviews.json")
                        .done(function(data) {
                            obj.toStorage(data);
                            resolve(true)
                        })
                        .fail(function(data) {
                            reject(error)
                        })
                }
            })
            return reviewPromise;
        }

        // push new review onto review list and save tp storage, in real life  
        // we would post reviews to the server for moderation.        
        this.addNew = function(data) {
            let obj = this;
            obj.getList()
                .then(function() {
                    let list = [...obj.list];
                    list.push(data);
                    obj.toStorage(list);
                })
        }

        // get list of cupcakes, filter out the ones required for the container
        // call the new review constrctor for each one and append returned content to container element      
        this.buildReviews = function(container) {
            let obj = this;
            obj.getList()
                .then(function() {
                    let list = [...obj.list];
                    let limit = $(container).data('reviews-count');
                    let forcupcake = parseInt($(container).data('reviews-for'));
                    if (!isNaN(forcupcake)) {
                        list = [...list].filter(function(item) {
                            return item.cupcakeid === forcupcake;
                        });
                    }
                    list = [...list].sort(function(a, b) {
                        return new Date(b.date) - new Date(a.date);
                    }).splice(0, limit);
                    $(container).empty();
                    list.forEach(function(item) {
                        let review = new Review(item);
                        review.build(container);
                    })
                })
                .catch(function(error) { //something went wrong with fetching data 
                    console.log('Error:' + error);
                })
        }
    }

    //constructor for single review
    function Review(data) {
        this.cupcakeid = data.cupcakeid;
        this.date = data.date;
        this.userid = data.userid;
        this.rating = data.rating;
        this.comments = data.comments;
        this.template = `<blockquote class="col auto">
        <div class="rating stars-${this.rating}"></div>
        ${this.comments}<small>${new Date(this.date).toLocaleDateString()}</small>
        </blockquote>`;
        this.build = function(container) {
            $(container).append(this.template)
        }
    }

    //the constructor to manage our list of cupcakes  
    function Cupcakes() {
        'use strict';
        //set list by default to data in storage, it might be null, this is ok
        this.list = JSON.parse(sessionStorage.getItem("cupcakes"));

        //here we save any updates to our cupcake list and to storage
        this.sessionStore = function(data) {
            this.list = data;
            sessionStorage.setItem("cupcakes", JSON.stringify(data));
        }

        //Check if the list is null, if so get from the 'database' using ajax. 
        //As Ajax is asyncronise we wrap it all in a promise so that functions
        //that call this must wait for the promise to resolve before it can continue        
        this.getList = function() {
            let obj = this;
            return new Promise(function(resolve, reject) {
                if (obj.list != null && typeof(obj.list) != 'undefined') {
                    resolve(true)
                } else {
                    $.get("assets/data/cupcakes.json")
                        .done(function(data) {
                            obj.sessionStore(data);
                            resolve(true)
                        })
                        .fail(function(data) {
                            console.log(error);
                            reject(error)
                        })
                }
            })
        }
        //return the data form a single cupcake by its id 
        this.findItem = function(id) {
            let list = [...this.list];
            let match = list.find(function(item) {
                return item.id === id;
            })
            return match;
        }
        //set parameters for cupcake list in the "This week's creations" content area, and call function to populate
        this.soldOut = function(container) {
            //prepare parameters for soldout batch
            let params = {
                orderBy: 'last_baked',
                start: 1,
                limit: 4
            }
            this.buildList(container, params, 'simple');
        }
        //set parameters for cupcake list in the "Hall of fame" content area, and call function to populate
        this.hallofFame = function(container) {
                let params = {
                    orderBy: 'avg_rating',
                    start: 0,
                    limit: 12
                }
                this.buildList(container, params, 'simple');
            },
            //set parameters for cupcake that goes in the hero banner ie 'the daily cupcake', and call function to populate
            this.heroBanner = function(container) {
                //prepare parameters for soldout batch
                let params = {
                    orderBy: 'last_baked',
                    start: 0,
                    limit: 1
                }
                this.buildList(container, params, 'banner');
            }
        //set parameters for cupcake that goes on the order page ie 'the daily cupcake', and call function to populate  
        this.fullPage = function(container) {
            //prepare parameters for soldout batch
            let params = {
                orderBy: 'last_baked',
                start: 0,
                limit: 1
            }
            this.buildList(container, params, 'fullpage');
            let reviews = new Reviews();
            reviews.buildReviews("#reviews");
        };
        //get cupcake list, filter it by given parameters and popuplate given container                 
        this.buildList = function(container, params, template) {
            let obj = this;
            obj.getList()
                .then(function() {
                    //sort batch then build	 
                    let batch = [...obj.list].sort(function(a, b) {
                        if (params.orderBy == 'last_baked') {
                            return new Date(b.last_baked) - new Date(a.last_baked);
                        } else {
                            return b[params.orderBy] - a[params.orderBy];
                        }
                    }).splice(params.start, params.limit);
                    batch.forEach(function(item) {
                        let cc;
                        if (template != 'simple') {
                            cc = new DailyCupcake(item);
                        } else {
                            cc = new Cupcake(item);
                        }
                        cc.build(container, template);
                    });

                })
                .catch(function(error) { //something went wrong with fetching data 
                    console.log('Error:' + error);
                })
        };
    }


    //constructor for single cupcake
    function Cupcake(data) {
        this.id = data.id;
        this.title = data.title;
        this.subtitle = data.subtitle;
        this.short_desc = data.short_desc;
        this.description = data.description;
        this.img_url = data.img_url;
        this.price = data.price;
        this.qty_box = data.qty_box;
        this.hall_fame = data.hall_fame;
        this.last_baked = data.last_baked;
        this.ingredients = data.ingredients;
        this.allergens = data.allergens;
        this.avg_rating = data.avg_rating;
        this.toolsTemplate = `<ul class="nav-cupcake-tools">
        <li><a data-bs-toggle="offcanvas" data-review="${this.id}" data-bs-target="#reviewCanvas" aria-controls="reviewCanvas" class="rating stars-${Math.round(this.avg_rating)}"  data-toggle="tooltip" data-placement="top" title="Write Review">Write Review</a></li> 
        <li><a class="icon-bell" data-alert="${this.id}" data-toggle="tooltip" data-placement="top" title="Get Cupcake alert">Add alert</a></li> 
        </ul><div data-alerts-for="${this.id}" class="alert alert-success  "></div>`;
        this.templates = {
            simple: `<li class="col splash">
            <figure class=""><img src="${this.img_url.small}" ></figure>
            <h4>${this.title}</h4>
            <p>${this.subtitle}</p>
            ${this.toolsTemplate}             
        </li> `,
            alerts: `<li class="col splash">
            <figure class=""><img src="${this.img_url.small}" ></figure>
            <div>
            <h5>${this.title}</h5>
            <a class="icon-bell" data-alert="${this.id}" data-toggle="tooltip" data-placement="top" title="Remove Cupcake alert">Remove alert</a>           
            </div>
            </li> `
        }
        this.build = function(container, template) {
            let cc = this;
            $(container).append(
                this.templates[template]
            )
            let alerts = new Alerts();
            if (alerts.contains(this.id)) {
                $('[data-alert="' + this.id + '"]').addClass('active');
            }
        }
    }

    //extend normal cupcake constructor for the daily cupcake with extra proerties and more detailed templates.
    function DailyCupcake(data) {
        Cupcake.call(this, data);
        this.stock = data.stock;
        this.is_vegan = data.is_vegan;
        this.ingredientsHTML = function() {
            let html = '<ul class="d-flex flex-grid flex-wrap row-cols-1 row-cols-md-2">';
            let ingredientsArr = this.ingredients.split(',');
            for (let i = 0; i < ingredientsArr.length; i++) {
                html += `<li>${ingredientsArr[i]}</li>`;
            }
            html += '</ul>';
            return html;
        }
        this.allergensHTML = function() {
            let allergens = this.allergens;
            let html = '<table class="text-center"><caption class="h4">Allergens</caption><thead><tr>';
            for (allergen in allergens) {
                html += `<th>${allergen}</th>`;
            }
            html += '</tr></thead><tbody><tr class="checklist">';
            for (allergen in allergens) {
                if (allergens[allergen]) {
                    html += `<td><i class="yes">&#10003;</i></td>`;
                } else {
                    html += `<td><i class="no">&#10007;</i></td>`;
                }
            }
            html += '</tr></tbody></table>';
            return html;
        }
        this.templates = {
            banner: `<article>
            <picture>
            <source media="(min-width: 1200px)" srcset="${this.img_url.banner}">
            <source media="(min-width: 481px)" srcset="${this.img_url.large}">
            <img alt="${this.title}" src="${this.img_url.small}">
            </picture>
            <header>
            <div class="container">
                <div class="row d-flex">
                <div class="col col-md-8 col-lg-6">
                    <h1>${this.title}</h1>          
                    <p class="lead">${this.subtitle}</p>
                    <a class="btn btn-primary" href="order.html">Order now</a>
                    ${this.toolsTemplate} 
                    </div>
                </div>
                </div>
            </header>
        </article>`,
            fullpage: `<div class="flex-row row d-flex flex-wrap align-items-center justify-content-between">
            <div class="col-12 col-md-6">    
                <figure><img alt="${this.title}" src="${this.img_url.large}"></figure>
            </div>
            <div class="col-12 col-md-5"> 
            <h2>${this.title}</h2>
            <p>${this.short_desc}</p>
            <p class="lead"><strong>R${this.price}</strong> per box of ${this.qty_box}</p>
            <dl>
                <dt>In stock:</dt><dd>${this.stock} boxes</dd>
                <dt>Vegan:</dt><dd>${(this.is_vegan)? 'Yes':'No'}</dd>
            </dl>
            <form id="formOrder" class="requires-validation">
            <input type="hidden" value="${this.id}" name="id">
                <div class="form-group qty">
                <label for="quantity">Number of boxes:</label>
                <input class="form-control" name="quantity" type="number" placeholder="1" min="1" max="${this.stock}" value="" required>
                <button class="btn btn-primary" type="submit">Check out</button>
                </div>
            </form>
            ${this.toolsTemplate}                        
            </div> 
        </div> 
    </div>
    </section><hr/>
    <section class="content product">
    <div class="container">
    <div class="flex-row d-flex flex-wrap justify-content-between">
        <div class="col-12 col-lg-6">
        <h3>${this.subtitle}</h3>
        ${this.description} 
        </div>
        <div class="col-12 col-lg-5">    
            <h4>Ingredients</h4>
            ${this.ingredientsHTML()} 
            ${this.allergensHTML()} 
        </div> 
    </div><hr/>
    <h2>Cupcake reviews</h2>
    <div id="reviews" data-reviews-for="${this.id}" data-reviews-count="3" class="flex-row flex-wrap d-flex list-unstyled row-cols-1 row-cols-md-2 row-cols-lg-3 justify-content-center text-center row gx-md-4 gx-lg-5">
      <!-- daily cupcake reviews injected here --> 
    </div>`
        }
    }

    //constructor to manage items in the cart    
    function Cart() {
        // set the cart to storage, might be null, this is ok
        this.list = JSON.parse(localStorage.getItem("cart"));
        // get the count the total quantity of items in cart    
        this.getTotal = function() {
            let total = 0;
            let list = (this.list == null) ? [] : [...this.list];
            list.forEach(function(item) {
                total += item.quantity;
            });
            return total;
        }
        // set the total quantity as an object property 
        this.total = this.getTotal();

        // store any updates to the cart to the list and to storage, update the cart count.
        this.toStorage = function(data) {
            this.list = data;
            localStorage.setItem("cart", JSON.stringify(data));
            this.getTotal();
            $('[data-cart-count]').html(this.total);
        }
        // items added via order form
        this.addItem = function(data) {
            let list = (this.list == null) ? [] : [...this.list];
            //try update first as product might be in cart already
            let updated = this.updateItem(data.id, data.quantity);
            if (!updated) {
                list.push(data);
                this.toStorage(list);
            }
        }
        //try to update the quantity of a product in the cart, if its not found return false  
        this.updateItem = function(id, toadd) {
            let cart = this;
            let list = (cart.list == null) ? [] : [...cart.list];
            let updated = false;
            for (index in list) {
                if (list[index].id === id) {
                    list[index].quantity += toadd;
                    cart.toStorage(list);
                    updated = true;
                    break;
                }
            }
            return updated;
        }
        //Make ZAR amount pretty for output
        this.nf = function(number) {
            return number.toLocaleString('en-GB', {
                minimumFractionDigits: 2
            });
        }
        //Build the cart table              
        this.buildList = function(container, allcupcakes) {
            let list = (this.list == null) ? [] : [...this.list];
            $(container).empty();
            let grandtotal = 0;
            for (let i = 0; i < list.length; i++) {
                let cc = new Cupcake(allcupcakes.findItem(list[i].id));
                let total = cc.price * list[i].quantity;
                grandtotal += total;
                $(container).append(`<tr><td>${cc.title}</td><td><input data-prev-value="${list[i].quantity}" data-qty-for=${cc.id}  class="form-control" name="quantity" type="number" placeholder="1" min="0" max="${this.stock}" value="${list[i].quantity}" required></td><td>${this.nf(total)}</td></tr>`);
            }
            $(container).next('tfoot').html(`<tr><td>Total due</td><td>&nbsp;</td><td>${this.nf(grandtotal)}</td></tr>`);
        }
    }

    //constructor to manage the alerts list     
    function Alerts() {
        //set list to what is in storage initially, null is also ok   
        this.list = JSON.parse(localStorage.getItem("alerts"));
        // set the alert count as an object property
        this.total = (this.list == null) ? 0 : this.list.length;
        // function to check if alert already in list, if it is them remove it, else add it
        this.toggle = function(id) {
            let alerts;
            alerts = (this.list == null) ? [] : [...this.list];
            let wasFound = false;
            for (let i = 0; i < alerts.length; i++) {
                if (parseInt(alerts[i]) === parseInt(id)) {
                    alerts.splice(i, 1);
                    wasFound = true;
                }
            }
            if (wasFound === false) {
                alerts.push(id);
            }
            this.toStorage(alerts);
            return !wasFound;
        }

        //set updates to the Object's list and save to storage  
        this.toStorage = function(data) {
            this.list = data;
            this.total = this.list.length;
            localStorage.setItem("alerts", JSON.stringify(data));
        }

        //this is used by the cupcake object to set the alert button class on initial page build
        this.contains = function(id) {
            let list = (this.list == null) ? [] : [...this.list];
            let wasFound = false;
            for (let i = 0; i < list.length; i++) {
                if (parseInt(list[i]) === parseInt(id)) {
                    wasFound = true;
                }
            }
            return wasFound;
        }
        //build the list of stored alerts on the 'Alerts' page, required the cupcakes list
        //and initialises and builds a cupcake for each matching cupcake. 
        this.buildList = function(container, allcupcakes) {
            let alerts = (this.list == null) ? [] : [...this.list];
            $(container).empty();
            for (let i = 0; i < alerts.length; i++) {
                let cc = new Cupcake(allcupcakes.findItem(alerts[i]));
                cc.build(container, 'alerts');
            }
        }
    }


});