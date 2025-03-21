if (typeof jQuery === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';

    script.onload = function () {
        initWaitlist();
    };

    document.head.appendChild(script);
} else {
    initWaitlist();
}

// Hàm khởi tạo waitlist
function initWaitlist() {
    jQuery(document).ready(function ($) {
        const selectors = {
            collection: ".c7-product-collection",
            collectionProduct: ".c7-product",
            c7Wrapper: "c7-content",
            waitlist: ".c7-waitlist",
            form: "form",
            showModal: ".show-waitlist-modal",
            joinWaitlist: ".waitlist-submit",
            waitlistModal: ".waitlist-modal-wrapper",
            waitlistEmail: ".waitlist-email",
            waitlistModalClose: ".close-wailtlist-modal",
            waitlistNotification: ".waitlist-notification",
            waitlistForm: ".waitlist-form",
        };

        const triggerProducts = () => {
            const collections = document.querySelectorAll(selectors.collection);
            if (collections) {
                collections.forEach((collection) => {
                    new MutationObserver((_, observer) => {
                        const products = collection.querySelectorAll(
                            selectors.collectionProduct
                        );
                        if (products) {
                            products.forEach((product) => {
                                const waitlist = product.querySelector(selectors.waitlist);
                                // Check Sold Out & Render Join Waitlist

                                const atcForm = product.querySelector(selectors.form);
                                const messError = product.querySelector(".c7-message");
                                const loginMess = product.querySelector(".c7-product__login-message");
                                if (!atcForm) {
                                    const productAnchor = product.querySelector("a");
                                    const productLink = productAnchor.getAttribute("href");
                                    renderWaitlistContent(productLink, messError, loginMess, function (content) {
                                        waitlist.innerHTML = content;
                                    });

                                }
                            });
                            observer.disconnect();
                        }
                    }).observe(collection, { childList: true, subtree: true });
                });
            }

            const c7Wrapper = document.getElementById(selectors.c7Wrapper);

            if (c7Wrapper && window.location.href.includes("/product/")) {
                new MutationObserver((_, observer) => {
                    const waitlist = document.querySelector(selectors.waitlist);
                    if (waitlist) {
                        const atcForm = c7Wrapper.querySelector(selectors.form);
                        const messError = c7Wrapper.querySelector(".c7-message");
                        const loginMess = c7Wrapper.querySelector(".c7-product__login-message");
                        if (!atcForm) {
                            renderWaitlistContent(window.location.href, messError, loginMess, function (content) {
                                waitlist.innerHTML = content;
                            });
                        }
                        observer.disconnect();
                    }
                }).observe(c7Wrapper, { childList: true, subtree: true });
            }
        };
        const tenantId = $("#waitlist-javascript").data("tenant")

        const createBasicAuth = (credentials) => btoa(credentials);

        const credentials = 'waitlist:qsoINUkmk1vVLVhzN3M0zYlf2goxXixT06iRXt9X9jBBF624cbuvv38RvjpwXmVo';
        const base64Credentials = createBasicAuth(credentials);

        var config = {
            baseUrl: 'https://api.commerce7.com/v1',
            tenantId: tenantId,
            credentials: base64Credentials
        };

        async function getCustomerData(token) {
            if (!token || !config.tenantId) {
                return {
                    success: false,
                    data: null
                };
                // throw new Error('Empty tenant id or empty token');
            }

            try {
                const response = await fetch(`${config.baseUrl}/customer/self`, {
                    method: 'GET',
                    headers: {
                        'Authorization': token,
                        'tenant': config.tenantId,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('API request failed');
                }

                const data = await response.json();
                return {
                    success: true,
                    data: data
                };
            } catch (error) {
                console.error('Error fetching customer data:', error);
                return {
                    success: false,
                    data: null
                };
            }
        }
        async function callCommerce7Api(endpoint, options = null, method = 'GET') {
            try {
                const queryString = method === 'GET' && options ? '?' + new URLSearchParams(options).toString() : '';

                const response = await fetch(`${config.baseUrl}${endpoint}${queryString}`, {
                    method: method,
                    headers: {
                        'Authorization': `Basic ${config.credentials}`,
                        'tenant': config.tenantId,
                        'Content-Type': 'application/json'
                    },
                    body: method === 'POST' ? JSON.stringify(options) : null
                });

                if (!response.ok) {
                    throw new Error('Commerce7 Response Error');
                }

                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        }

        // Hàm render waitlist content đã được cập nhật
        async function renderWaitlistContent(productLink, messError, loginMess, callback) {
            const parts = productLink.split("/");
            const title = parts.pop() || parts.pop();
            const token = getCookie('customerToken');
            try {
                const response = await getCustomerData(token);
                let html = '';
                if (!response.success) {
                    if (!messError && !loginMess) {
                        html += '<h5 class="product-soldout">Sold Out</h5>';
                        html += `<button class="button primary show-waitlist-modal" data-title="${title}">join waitlist</button>`;
                    }
                    callback(html);
                    return;
                }

                if (!messError && !loginMess) {
                    html += '<h5 class="product-soldout">Sold Out</h5>';
                }

                html += `<button class="button primary show-waitlist-modal" data-title="${title}">join waitlist</button>`;
                callback(html);
            } catch (error) {
                console.error('Error rendering waitlist content:', error);
                callback('');
            }
        }

        const getCookie = (cookieName) => {
            var name = cookieName + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var cookieArray = decodedCookie.split(';');
            for (var i = 0; i < cookieArray.length; i++) {
                var cookie = cookieArray[i];
                while (cookie.charAt(0) === ' ') {
                    cookie = cookie.substring(1);
                }
                if (cookie.indexOf(name) === 0) {
                    return cookie.substring(name.length, cookie.length);
                }
            }
            return "";
        }

        jQuery(document).on("click", selectors.showModal, function (e) {
            jQuery('.c7-product-popup-close').click();
            const title = jQuery(this).data("title");
            const modalContent =
                '<div class="waitlist-modal-wrapper" id="waitlist-modal"><div class="waitlist-modal-content"><span class="close-wailtlist-modal">+</span><h2>Waitlist Signup</h2><p>Please add your email address below and we will notify you when this is available for purchase.</p><div class="waitlist-form"><label>Email Address *</label><input type="email" class="waitlist-email"><p class="waitlist-notification"></p><div class="button primary waitlist-submit" data-title="' +
                title +
                '">Submit</div></div></div></div>';
            jQuery("body").append(modalContent);
        });

        jQuery(document).on("click", selectors.joinWaitlist, async function () {
            try {
                const email = jQuery(selectors.waitlistEmail).val();
                const title = jQuery(this).data("title");

                jQuery(selectors.waitlistNotification).html("");
                if (!validateEmail(email)) {
                    jQuery(selectors.waitlistNotification).html('Input valid email address.');
                    return;
                }
                const customers = await callCommerce7Api("/customer/", { q: email });
                let customerId;
                if (customers.total === 0) {
                    const newCustomer = await callCommerce7Api("/customer/", {
                        emails: [{ email: email }]
                    }, "POST");
                    customerId = newCustomer.id;
                } else {
                    customerId = customers.customers[0].id;
                }

                // Tìm hoặc tạo tag
                const tagName = `Waitlist: ${title}`;
                const tags = await callCommerce7Api("/tag/customer/", { q: tagName });
                let tagId;

                if (tags.total === 0) {
                    const newTag = await callCommerce7Api("/tag/customer/", {
                        title: tagName,
                        type: "Manual"
                    }, "POST");
                    tagId = newTag.id;
                } else {
                    tagId = tags.tags[0].id;
                }

                // Gán tag cho customer
                await callCommerce7Api("/tag-x-object/customer/", {
                    objectId: customerId,
                    tagId: tagId
                }, "POST");

                // Hiển thị thông báo thành công
                jQuery(selectors.waitlistForm).html('Received! You\'re on the list!');

            } catch (e) {
                jQuery(selectors.waitlistNotification).html('System is busy at this moment. Please try again later.');
            }
        });
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        jQuery(document).on("click", selectors.waitlistModalClose, function () {
            jQuery(selectors.waitlistModal).remove();
        });

        triggerProducts();
    });
}
