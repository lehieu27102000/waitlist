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
async function initWaitlist() {
    jQuery(document).ready(async function ($) {
        try {
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
            var configSetting = {
                baseUrl: 'https://doant72.sg-host.com/',
                tenantId: tenantId,
            };
            async function getSetting(endpoint, options = null, method = 'GET') {
                try {
                    const queryString = method === 'GET' && options ? '?' + new URLSearchParams(options).toString() : '';

                    const response = await fetch(`${configSetting.baseUrl}${endpoint}${queryString}`, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json'

                        },
                        body: method === 'POST' ? JSON.stringify(options) : null
                    });

                    if (!response.ok) {
                        throw new Error('App Waitlist Response Error');
                    }

                    return await response.json();
                } catch (error) {
                    console.error('API Error:', error);
                    throw error;
                }
            }
            const res = await callCommerce7Api('/customer');
            if (!res) {
                return;
            }
            var setting = await getSetting('/api/waitlist-settings', { tenant_id: tenantId })
            console.log(setting)
            if (!setting.enabled) {
                return
            }
            const buttonText = setting.button_text
            var buttonTextWaitlist = JSON.parse(buttonText).btn_text
            var buttonTextWaitlisted = JSON.parse(buttonText).btn_text_submitted
            var buttonStyle = JSON.parse(setting.button_style)
            const cssString = `
    .btn-primary {
        background-color: ${buttonStyle.backgroundColor};
        color: ${buttonStyle.textColor};
        outline: ${buttonStyle.outlineWidth} ${buttonStyle.outlineStyle} ${buttonStyle.outlineColor};
    }
    .btn-primary:hover {
        background-color: ${buttonStyle.hoverBackgroundColor};
        color: ${buttonStyle.hoverTextColor};
    }
`;

            const styleTag = document.createElement("style");
            styleTag.innerHTML = cssString;
            document.head.appendChild(styleTag);
            var customer = {};
            var lastClickedButton = null;
            const triggerProducts = async () => {
                try {
                    const token = getCookie('customerToken');
                    const response = await getCustomerData(token);
                    customer = response.data
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
                } catch (e) {
                    console.log(e)
                }
            };


            // Hàm render waitlist content đã được cập nhật
            function renderWaitlistContent(productLink, messError, loginMess, callback) {
                const parts = productLink.split("/");
                const title = parts.pop() || parts.pop();
                let isSoldOut = false;
                let html = '';
                if (!customer) {
                    if (!messError && !loginMess) {
                        html += '<h5 class="product-soldout">Sold Out</h5>';
                        html += `<button class="btn-primary show-waitlist-modal" data-title="${title}">${buttonTextWaitlist}</button>`;
                    }
                    callback(html);
                    return;
                }

                if (!messError && !loginMess) {
                    isSoldOut = true
                    html += '<h5 class="product-soldout">Sold Out</h5>';
                }

                html += `<button class="btn-primary show-waitlist-modal ${isSoldOut ? '' : 'for-club'}" data-title="${title}">${buttonTextWaitlist}</button>`;
                callback(html);
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
                let modalContent = ''
                if ($(this).hasClass('for-club')) {
                    renderModalForClub($(this))
                    return;
                }
                jQuery("body").append(renderModalForSoldout(modalContent, title, $(this)));
            });
            const renderModalForClub = (element) => {
                if (!customer) {
                    return
                }
                handleAssignTag(element)
                return;
            }
            const renderModalForSoldout = (modalContent, titleProduct, element) => {
                if (customer) {
                    handleAssignTag(element)
                    return
                }
                modalContent =
                    `<div class="waitlist-modal-wrapper" id="waitlist-modal"><div class="waitlist-modal-content"><span class="close-wailtlist-modal">+</span><h2>${setting.popup_title}</h2><p>${setting.popup_body}</p><div class="waitlist-form"><label>Email Address *</label><input type="email" class="waitlist-email"><p class="waitlist-notification"></p><button class="btn-primary waitlist-submit" data-title="${titleProduct}">Submit</button></div></div></div>`;
                lastClickedButton = element
                return modalContent;
            }
            const handleAssignTag = async (element) => {
                try {
                    const email = customer && customer.emails && customer.emails[0] && customer.emails[0].email ? customer.emails[0].email : jQuery(selectors.waitlistEmail).val();
                    const title = element.data("title");

                    jQuery(selectors.waitlistNotification).html("");
                    if (!validateEmail(email) || !email) {
                        jQuery(selectors.waitlistNotification).html('Please enter your email and make sure it is in the correct format.');
                        return;
                    }
                    jQuery("body").append('<div class="waitlist-modal-wrapper loading-modal" id="loading-modal"><div class="waitlist-modal-content"><div class="loading-spinner"></div></div></div>');
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

                    const res = await callCommerce7Api("/tag-x-object/customer/", {
                        objectId: customerId,
                        tagId: tagId
                    }, "POST");
                    jQuery("#loading-modal").remove();
                    renderModalSuccess();
                    $(element).closest(selectors.waitlist).find('button').text(buttonTextWaitlisted)
                } catch (e) {
                    jQuery("#loading-modal").remove();
                    alert("System is busy at this moment. Please try again later.")
                }
            }
            const renderModalSuccess = () => {
                if (jQuery(selectors.waitlistForm).length > 0) {
                    jQuery(selectors.waitlistForm).html(setting.success_message);
                    $(lastClickedButton).text(buttonTextWaitlisted)
                    $(lastClickedButton).removeClass("show-waitlist-modal")
                    return
                }
                const modalContent =
                    `<div class="waitlist-modal-wrapper" id="waitlist-modal"><div class="waitlist-modal-content"><span class="close-wailtlist-modal">+</span><h2>${setting.popup_title}</h2><div class="waitlist-form"><p class="waitlist-notification">${setting.success_message}</p></div></div></div>`;
                jQuery("body").append(modalContent);
            }
            // action for sold out
            jQuery(document).on("click", selectors.joinWaitlist, function () {
                handleAssignTag($(this))

            });
            function validateEmail(email) {
                const spamPattern = /^(test|fake|spam|noreply)[\w.-]*@/i;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email) && !spamPattern.test(email);
            }

            jQuery(document).on("click", selectors.waitlistModalClose, function () {
                jQuery(selectors.waitlistModal).remove();
            });

            triggerProducts();
        } catch (e) {
            console.log(e)
        }
    });
}
