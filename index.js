const { url, token_id } = require('./config.js');
const { MongoClient } = require('mongodb');
const MongoDBclient = new MongoClient(url);

// ПОДКЛЮЧЕНИЕ К БД ОБОЗНАЧЕНИЕ ВСЕХ ПЕРЕМЕННЫХ
const connect = async () => {
    try {
        await MongoDBclient.connect();
        console.log("Успешно подключились к базе данных");

        const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных
        const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

        const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'

        global.admin_password = admin.password;
        global.curs = admin.curs;
        global.persent = admin.persent;
        global.service_price = admin.service_price;
        global.perfume_priceStepOne = admin.perfume_priceStepOne;
        global.shoes_priceStepOne = admin.shoes_priceStepOne;
        global.clothes_priceStepOne = admin.clothes_priceStepOne;
        global.bag_priceStepOne = admin.bag_priceStepOne;
        global.clock_priceStepOne = admin.clock_priceStepOne;
        global.bannedUsers = admin.bannedUsers;

    } catch (e) {
        console.log(e);
    }
}

connect();



const TelegramApi = require('node-telegram-bot-api');

const token = token_id;
const bot = new TelegramApi(token, { polling: true });


const userContext = {};





const messageHandler = async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Проверяем, что сообщение приходит от нужного пользователя
    if (userContext[userId] && userContext[userId].awaitingResponse) {
        // Проверяем, что пользователь ожидает ответа
        if (chatId === userId) {
            // Здесь ваша логика обработки сообщения
            // Можете вызвать соответствующую функцию для обработки
        }
    }
};


async function waitForVolume(chatId) {
    connect();
    if (!userContext[chatId]) {
        userContext[chatId] = { awaitingResponse: true };
    } else {
        userContext[chatId].awaitingResponse = true;
    }

    try {
        await bot.sendMessage(chatId, 'Введите объём духов в мл. :', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отмена', callback_data: 'cancel' }]
                ]
            }
        });

        const messageHandler = async (msg) => {
            userContext[chatId].awaitingResponse = true;
            if (userContext[chatId].awaitingResponse && msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const perfumeVolume = msg.text;
                if (isNaN(perfumeVolume)) {
                    await bot.sendMessage(chatId, 'Вы ввели некорректные данные.')
                    await waitForVolume(chatId);
                } else {
                    console.log('Вы ввели правильные данные:', perfumeVolume);
                    await waitForPrice(chatId, perfumeVolume);
                }
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('message', messageHandler);

        const callbackHandler = async (callbackQuery) => {
            if (callbackQuery.message.chat.id === chatId && callbackQuery.data === 'cancel') {
                bot.off('message', messageHandler);
                bot.off('callback_query', callbackHandler);
                try {
                    // Проверяем наличие сообщения перед его удалением
                    const message = callbackQuery.message;
                    if (message) {
                        await bot.deleteMessage(chatId, message.message_id);
                    }
                } catch (error) {
                    // Если сообщение уже удалено или возникает другая ошибка при удалении, просто логируем ее
                    console.error('Ошибка удаления сообщения ' + error);
                }
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('callback_query', callbackHandler);

    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        if (userContext[chatId]) {
            userContext[chatId].awaitingResponse = false;
        }
    }
}









async function waitForPrice(chatId, perfumeVolume) {
    console.log(chatId);
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата
    try {
        const perfumImg = 'img/perfum.jpg';
        await bot.sendPhoto(chatId, perfumImg, { contentType: 'image/jpeg'});
        await bot.sendMessage(chatId, 'Введите цену в ¥: ');
        const messageHandler = async (msg) => {
            if(msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const perfumePrice = msg.text;
                console.log('до условия')
                if (!isNaN(perfumePrice)) {
                    console.log('ты прошёл!')
                    await waitForPhoto(chatId,perfumeVolume,perfumePrice);
                }
                else {
                    await bot.sendMessage(chatId, 'Вы ввели некорректные данные. Попробуйте ещё раз!');
                    await waitForPrice(chatId, perfumeVolume);
                }
            }
        }

        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании цены:', error);
    }
    finally {
        userContext[chatId].awaitingResponse = false;
    }
}

async function waitForPhoto(chatId, perfumeVolume, perfumePrice) {
    connect();
    console.log('ты прошёл')
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата
    try {
        await bot.sendMessage(chatId, 'Теперь, пожалуйста, прикрепите фотографию духов.');
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const photoId = msg.photo && msg.photo.length > 0 ? msg.photo[msg.photo.length - 1].file_id : null;
                const userId = msg.from.id;
                const UserName = msg.from.username;
                const adminId = '781115975';
                const perfumePrise_Rub = perfumePrice * curs;
                const resultPerfume = perfumePrise_Rub * persent;
                const result = resultPerfume + Number(perfumePrise_Rub) + Number(service_price) + Number(perfume_priceStepOne);
                const now = new Date();
                const messegeToAdmin =
                    `Пользователь: @${UserName}\n\n` +
                    `Категория: Духи\n` +
                    `Объём: ${perfumeVolume} мл.\n` +
                    `Цена: ${perfumePrice} ¥\n` +
                    `Время заказа: ${now.toLocaleString()}\n\n` +
                    `Курс: ${curs}\n` +
                    `Общая сумма: ${result.toFixed(2)} руб.\n` +
                    `Сервисный сбор: ${service_price} руб.\n` +
                    `Доставка: ${perfume_priceStepOne} руб.\n` +
                    `Цена товара в рублях: ${perfumePrise_Rub.toFixed(2)} руб.\n\n` +
                    `Профит:  ${resultPerfume.toFixed(2)} руб. - ${persent*100} %):\n\n` +
                    `ID для бана: <a href="tg://user?id=${userId}">${userId}</a>;`;
                if(photoId) {
                    await bot.sendPhoto(adminId, photoId, { caption: messegeToAdmin, parse_mode: 'HTML' });
                    await bot.sendMessage(chatId, 'Спасибо! Ваша заявка принята.\nСкоро с вами свяжется администратор.');
                }
                else {
                    await bot.sendMessage(chatId, 'Вы не прикрепили фото. Попробуйте ещё раз!');
                    await waitForPhoto(chatId,perfumeVolume,perfumePrice);
                }
            }
        }

        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании фотографии:', error);
    }
    finally {
        userContext[chatId].awaitingResponse = false;
    }
}

// --- ОБУВЬ



async function waitForSize(chatId) {
    if (!userContext[chatId]) {
        userContext[chatId] = { awaitingResponse: true };
    } else {
        userContext[chatId].awaitingResponse = true;
    }

    try {
        await bot.sendMessage(chatId, 'Введите размер обуви:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отмена', callback_data: 'cancel' }]
                ]
            }
        });

        const messageHandler = async (msg) => {
            userContext[chatId].awaitingResponse = true;
            if (userContext[chatId].awaitingResponse && msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const perfumeVolume = msg.text;
                if (isNaN(perfumeVolume)) {
                    await bot.sendMessage(chatId, 'Вы ввели некорректные данные.')
                    await waitForSize(chatId);
                } else {
                    console.log('Вы ввели правильные данные:', perfumeVolume);
                    await waitForPrice_shoes(chatId, perfumeVolume);
                }
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('message', messageHandler);

        const callbackHandler = async (callbackQuery) => {
            if (callbackQuery.message.chat.id === chatId && callbackQuery.data === 'cancel') {
                bot.off('message', messageHandler);
                bot.off('callback_query', callbackHandler);
                try {
                    // Проверяем наличие сообщения перед его удалением
                    const message = callbackQuery.message;
                    if (message) {
                        await bot.deleteMessage(chatId, message.message_id);
                    }
                } catch (error) {
                    // Если сообщение уже удалено или возникает другая ошибка при удалении, просто логируем ее
                    console.error('Ошибка удаления сообщения ' + error);
                }
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('callback_query', callbackHandler);

    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        if (userContext[chatId]) {
            userContext[chatId].awaitingResponse = false;
        }
    }
}

async function waitForPrice_shoes(chatId, perfumeVolume) {
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата

    try {
        const perfumImg = 'img/shoes.jpg';
        await bot.sendPhoto(chatId, perfumImg, { contentType: 'image/jpeg'});
        await bot.sendMessage(chatId, 'Введите цену в ¥: ');

        // Постоянный обработчик событий для сообщений
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                const perfumePrice = msg.text;
                console.log(perfumePrice);
                console.log(typeof perfumePrice);
                if (!isNaN(perfumePrice)) {
                    console.log('ты прошёл!')
                    await waitForPhoto_shoes(chatId, perfumeVolume, perfumePrice);
                    console.log(chatId);
                } else {
                    await bot.sendMessage(chatId, 'Вы ввели некорректные данные. Попробуйте ещё раз!');
                    await waitForPrice_shoes(chatId, perfumeVolume); // Вызываем waitForVolume снова для повторного ожидания
                }
            }
        };

        // Добавляем обработчик событий для сообщений
        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        // Сбрасываем флаг ожидания ответа для данного чата
        userContext[chatId].awaitingResponse = false;
        bot.off('message', messageHandler);
    }
}

async function waitForPhoto_shoes(chatId, perfumeVolume, perfumePrice) {
    connect();
    console.log('ты прошёл')
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата
    try {
        await bot.sendMessage(chatId, 'Теперь, пожалуйста, прикрепите фотографию Обуви.');
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const photoId = msg.photo && msg.photo.length > 0 ? msg.photo[msg.photo.length - 1].file_id : null;;
                const userId = msg.from.id;
                const UserName = msg.from.username;
                const adminId = '781115975';
                const perfumePrise_Rub = perfumePrice * curs;
                const resultPerfume = perfumePrise_Rub * persent;
                const result = resultPerfume + Number(perfumePrise_Rub) + Number(service_price) + Number(shoes_priceStepOne);
                const now = new Date();
                const messegeToAdmin =
                    `Пользователь: @${UserName}\n\n` +
                    `Категория: Обувь\n` +
                    `Размер: ${perfumeVolume} \n` +
                    `Цена: ${perfumePrice} ¥\n` +
                    `Время заказа: ${now.toLocaleString()}\n\n` +
                    `Курс: ${curs}\n` +
                    `Общая сумма: ${result.toFixed(2)} руб.\n` +
                    `Сервисный сбор: ${service_price} руб.\n` +
                    `Доставка: ${shoes_priceStepOne} руб.\n` +
                    `Цена товара в рублях: ${perfumePrise_Rub.toFixed(2)} руб.\n\n` +
                    `Профит:  ${resultPerfume.toFixed(2)} руб. - ${persent*100} %):\n\n` +
                    `ID для бана: <a href="tg://user?id=${userId}">${userId}</a>;`;

                if(photoId) {
                    await bot.sendPhoto(adminId, photoId, { caption: messegeToAdmin, parse_mode: 'HTML' });
                    await bot.sendMessage(chatId, 'Спасибо! Ваша заявка принята.\nСкоро с вами свяжется администратор.');
                }
                else {
                    await bot.sendMessage(chatId, 'Вы не прикрепили фото. Попробуйте ещё раз!');
                    await waitForPhoto_shoes(chatId,perfumeVolume,perfumePrice);
                }
            }
        }

        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании фотографии:', error);
    }
    finally {
        userContext[chatId].awaitingResponse = false;
        bot.off('message', messageHandler);
    }
}



// --- ОДЕЖДА


async function waitForSize_clothes(chatId) {
    if (!userContext[chatId]) {
        userContext[chatId] = { awaitingResponse: true };
    } else {
        userContext[chatId].awaitingResponse = true;
    }

    try {
        await bot.sendMessage(chatId, 'Введите размер одежды \n - S, M, L, XL', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отмена', callback_data: 'cancel' }]
                ]
            }
        });

        const messageHandler = async (msg) => {
            userContext[chatId].awaitingResponse = true;
            if (userContext[chatId].awaitingResponse && msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const perfumeVolume = msg.text;
                console.log('Вы ввели правильные данные:', perfumeVolume);
                await waitForPrice_clothes(chatId, perfumeVolume);
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('message', messageHandler);

        const callbackHandler = async (callbackQuery) => {
            if (callbackQuery.message.chat.id === chatId && callbackQuery.data === 'cancel') {
                bot.off('message', messageHandler);
                bot.off('callback_query', callbackHandler);
                try {
                    // Проверяем наличие сообщения перед его удалением
                    const message = callbackQuery.message;
                    if (message) {
                        await bot.deleteMessage(chatId, message.message_id);
                    }
                } catch (error) {
                    // Если сообщение уже удалено или возникает другая ошибка при удалении, просто логируем ее
                    console.error('Ошибка удаления сообщения ' + error);
                }
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('callback_query', callbackHandler);

    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        if (userContext[chatId]) {
            userContext[chatId].awaitingResponse = false;
        }
    }
}

async function waitForPrice_clothes(chatId, perfumeVolume) {
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата

    try {
        const perfumImg = 'img/clothes.jpg';
        await bot.sendPhoto(chatId, perfumImg, { contentType: 'image/jpeg'});
        await bot.sendMessage(chatId, 'Введите цену в ¥: ');

        // Постоянный обработчик событий для сообщений
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                const perfumePrice = msg.text;
                console.log(perfumePrice);
                console.log(typeof perfumePrice);
                if (!isNaN(perfumePrice)) {
                    console.log('ты прошёл!')
                    await waitForPhoto_clothes(chatId, perfumeVolume, perfumePrice);
                    console.log(chatId);
                } else {
                    await bot.sendMessage(chatId, 'Вы ввели некорректные данные. Попробуйте ещё раз!');
                    await waitForPrice_clothes(chatId, perfumeVolume); // Вызываем waitForVolume снова для повторного ожидания
                }
            }
        };

        // Добавляем обработчик событий для сообщений
        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        // Сбрасываем флаг ожидания ответа для данного чата
        userContext[chatId].awaitingResponse = false;
    }
}


async function waitForPhoto_clothes(chatId, perfumeVolume, perfumePrice) {
    connect();
    console.log('ты прошёл')
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата
    try {
        await bot.sendMessage(chatId, 'Теперь, пожалуйста, прикрепите фотографию Одежды: ');
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const photoId = msg.photo && msg.photo.length > 0 ? msg.photo[msg.photo.length - 1].file_id : null;;
                const userId = msg.from.id;
                const UserName = msg.from.username;
                const adminId = '781115975';
                const perfumePrise_Rub = perfumePrice * curs;
                const resultPerfume = perfumePrise_Rub * persent;
                const result = resultPerfume + Number(perfumePrise_Rub) + Number(service_price) + Number(clothes_priceStepOne);
                const now = new Date();
                const messegeToAdmin =
                    `Пользователь: @${UserName}\n\n` +
                    `Категория: Одежда\n` +
                    `Размер: ${perfumeVolume} \n` +
                    `Цена: ${perfumePrice} ¥\n` +
                    `Время заказа: ${now.toLocaleString()}\n\n` +
                    `Курс: ${curs}\n` +
                    `Общая сумма: ${result.toFixed(2)} руб.\n` +
                    `Сервисный сбор: ${service_price} руб.\n` +
                    `Доставка: ${clothes_priceStepOne} руб.\n` +
                    `Цена товара в рублях: ${perfumePrise_Rub.toFixed(2)} руб.\n\n` +
                    `Профит:  ${resultPerfume.toFixed(2)} руб. - ${persent*100} %):\n\n` +
                    `ID для бана: <a href="tg://user?id=${userId}">${userId}</a>;`;

                if(photoId) {
                    await bot.sendPhoto(adminId, photoId, { caption: messegeToAdmin, parse_mode: 'HTML' });
                    await bot.sendMessage(chatId, 'Спасибо! Ваша заявка принята.\nСкоро с вами свяжется администратор.');
                }
                else {
                    await bot.sendMessage(chatId, 'Вы не прикрепили фото. Попробуйте ещё раз!');
                    await waitForPhoto_clothes(chatId,perfumeVolume,perfumePrice);
                }
            }
        }

        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании фотографии:', error);
    }
    finally {
        userContext[chatId].awaitingResponse = false;
    }
}


// --- Сумки

async function waitForPrice_bag(chatId) {
    if (!userContext[chatId]) {
        userContext[chatId] = { awaitingResponse: true };
    } else {
        userContext[chatId].awaitingResponse = true;
    }

    try {
        const perfumImg = 'img/bag.jpg';
        await bot.sendPhoto(chatId, perfumImg, {
            caption: 'Введите цену сумки в ¥:',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отмена', callback_data: 'cancel' }]
                ]
            },
        });
        const messageHandler = async (msg) => {
            userContext[chatId].awaitingResponse = true;
            if (userContext[chatId].awaitingResponse && msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const perfumePrice = msg.text;
                if (isNaN(perfumePrice)) {
                    await bot.sendMessage(chatId, 'Вы ввели некорректные данные.')
                    await waitForPrice_bag(chatId);
                } else {
                    console.log('Вы ввели правильные данные:', perfumePrice);
                    await waitForPhoto_bag(chatId, perfumePrice);
                }
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('message', messageHandler);

        const callbackHandler = async (callbackQuery) => {
            if (callbackQuery.message.chat.id === chatId && callbackQuery.data === 'cancel') {
                bot.off('message', messageHandler);
                bot.off('callback_query', callbackHandler);
                try {
                    // Проверяем наличие сообщения перед его удалением
                    const message = callbackQuery.message;
                    if (message) {
                        await bot.deleteMessage(chatId, message.message_id);
                    }
                } catch (error) {
                    // Если сообщение уже удалено или возникает другая ошибка при удалении, просто логируем ее
                    console.error('Ошибка удаления сообщения ' + error);
                }
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('callback_query', callbackHandler);

    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        if (userContext[chatId]) {
            userContext[chatId].awaitingResponse = false;
        }
    }
}


async function waitForPhoto_bag(chatId, perfumePrice) {
    connect();
    console.log('ты прошёл')
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата
    try {
        await bot.sendMessage(chatId, 'Теперь, пожалуйста, прикрепите фотографию Сумки: ');
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const photoId = msg.photo && msg.photo.length > 0 ? msg.photo[msg.photo.length - 1].file_id : null;;
                const userId = msg.from.id;
                const UserName = msg.from.username;
                const adminId = '781115975';
                const perfumePrise_Rub = perfumePrice * curs;
                const resultPerfume = perfumePrise_Rub * persent;
                const result = resultPerfume + Number(perfumePrise_Rub) + Number(service_price) + Number(bag_priceStepOne);
                const now = new Date();
                const messegeToAdmin =
                    `Пользователь: @${UserName}\n\n` +
                    `Категория: Сумки\n` +
                    `Цена: ${perfumePrice} ¥\n` +
                    `Время заказа: ${now.toLocaleString()}\n\n` +
                    `Курс: ${curs}\n` +
                    `Общая сумма: ${result.toFixed(2)} руб.\n` +
                    `Сервисный сбор: ${service_price} руб.\n` +
                    `Доставка: ${bag_priceStepOne} руб.\n` +
                    `Цена товара в рублях: ${perfumePrise_Rub.toFixed(2)} руб.\n\n` +
                    `Профит:  ${resultPerfume.toFixed(2)} руб. - ${persent*100} %):\n\n` +
                    `ID для бана: <a href="tg://user?id=${userId}">${userId}</a>;`;

                if(photoId) {
                    await bot.sendPhoto(adminId, photoId, { caption: messegeToAdmin, parse_mode: 'HTML' });
                    await bot.sendMessage(chatId, 'Спасибо! Ваша заявка принята.\nСкоро с вами свяжется администратор.');
                }
                else {
                    await bot.sendMessage(chatId, 'Вы не прикрепили фото. Попробуйте ещё раз!');
                    await waitForPhoto_bag(chatId,perfumePrice);
                }
            }
        }

        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании фотографии:', error);
    }
    finally {
        userContext[chatId].awaitingResponse = false;
    }
}
// --- ЧАСЫ




async function waitForPrice_clock(chatId) {
    if (!userContext[chatId]) {
        userContext[chatId] = { awaitingResponse: true };
    } else {
        userContext[chatId].awaitingResponse = true;
    }

    try {
        const perfumImg = 'img/clock.jpg';
        await bot.sendPhoto(chatId, perfumImg, {
            caption: 'Введите цену часов в ¥:',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Отмена', callback_data: 'cancel' }]
                ]
            },
        });
        const messageHandler = async (msg) => {
            userContext[chatId].awaitingResponse = true;
            if (userContext[chatId].awaitingResponse && msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const perfumePrice = Number(msg.text);
                const test = isNaN(perfumePrice);
                console.log(test);
                if (isNaN(perfumePrice)) {
                    await bot.sendMessage(chatId, 'Вы ввели некорректные данные.')
                    await waitForPrice_clock(chatId);
                } else {
                    console.log('Вы ввели правильные данные:', perfumePrice);
                    await waitForPhoto_clock(chatId, perfumePrice);
                }
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('message', messageHandler);

        const callbackHandler = async (callbackQuery) => {
            if (callbackQuery.message.chat.id === chatId && callbackQuery.data === 'cancel') {
                bot.off('message', messageHandler);
                bot.off('callback_query', callbackHandler);
                try {
                    // Проверяем наличие сообщения перед его удалением
                    const message = callbackQuery.message;
                    if (message) {
                        await bot.deleteMessage(chatId, message.message_id);
                    }
                } catch (error) {
                    // Если сообщение уже удалено или возникает другая ошибка при удалении, просто логируем ее
                    console.error('Ошибка удаления сообщения ' + error);
                }
                userContext[chatId].awaitingResponse = false;
            }
        };

        bot.on('callback_query', callbackHandler);

    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        if (userContext[chatId]) {
            userContext[chatId].awaitingResponse = false;
        }
    }
}


async function waitForPhoto_clock(chatId, perfumePrice) {
    connect();
    console.log('ты прошёл')
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата
    try {
        await bot.sendMessage(chatId, 'Теперь, пожалуйста, прикрепите фотографию Часов: ');
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler);
                const photoId = msg.photo && msg.photo.length > 0 ? msg.photo[msg.photo.length - 1].file_id : null;;
                const userId = msg.from.id;
                const UserName = msg.from.username;
                const adminId = '781115975';
                const perfumePrise_Rub = perfumePrice * curs;
                const resultPerfume = perfumePrise_Rub * persent;
                const result = resultPerfume + Number(perfumePrise_Rub) + Number(service_price) + Number(clock_priceStepOne);
                const now = new Date();
                const messegeToAdmin =
                    `Пользователь: @${UserName}\n\n` +
                    `Категория: Часы\n` +
                    `Цена: ${perfumePrice} ¥\n` +
                    `Время заказа: ${now.toLocaleString()}\n\n` +
                    `Курс: ${curs}\n` +
                    `Общая сумма: ${result.toFixed(2)} руб.\n` +
                    `Сервисный сбор: ${service_price} руб.\n` +
                    `Доставка: ${clock_priceStepOne} руб.\n` +
                    `Цена товара в рублях: ${perfumePrise_Rub.toFixed(2)} руб.\n\n` +
                    `Профит:  ${resultPerfume.toFixed(2)} руб. - ${persent*100} %):\n\n` +
                    `ID для бана: <a href="tg://user?id=${userId}">${userId}</a>;`;

                if(photoId) {
                    await bot.sendPhoto(adminId, photoId, { caption: messegeToAdmin, parse_mode: 'HTML' });
                    await bot.sendMessage(chatId, 'Спасибо! Ваша заявка принята.\nСкоро с вами свяжется администратор.');
                }
                else {
                    await bot.sendMessage(chatId, 'Вы не прикрепили фото. Попробуйте ещё раз!');
                    await waitForPhoto_clock(chatId,perfumePrice);
                }
            }
        }

        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании фотографии:', error);
    }
    finally {
        userContext[chatId].awaitingResponse = false;
    }
}








async function waitForPrice_calc(chatId) {
    connect();
    console.log('зашли в духи')
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата
    const img = 'img/perfum.jpg';
    await bot.sendPhoto(chatId, img, { contentType: 'image/jpeg'});
    try {
        console.log('пробуем')
        await bot.sendMessage(chatId, 'Введите цену в ¥: ');

        // Постоянный обработчик событий для сообщений
        const messageHandler = async (msg) => {
            console.log('пробуем')
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                const perfumePrice = msg.text;
                if (!isNaN(perfumePrice)) {
                    console.log(perfumePrice);
                    const perfumePrise_Rub = perfumePrice * curs;
                    console.log("Стоимость духов: " + perfumePrise_Rub + " рублей");
                    const resultPerfume = perfumePrise_Rub * persent;
                    console.log(`комса тёмыча: ${resultPerfume} рублей`);
                    const result = resultPerfume + perfumePrise_Rub + Number(service_price) + Number(perfume_priceStepOne);
                    console.log("Доставка: " + perfume_priceStepOne);
                    console.log('Сервисный сбор: ' + service_price);
                    await bot.sendMessage(chatId, `Итого ${result.toFixed(2)} руб. с учётом всех расходов до москвы\n\nДля информации: \nКомиссия сервиса составила: ${resultPerfume.toFixed(2)} руб. (Уже учтено в цене) \nКурс юаня: ${curs} \nКатегория: Духи `)
                    await bot.sendMessage(chatId, 'По всем вопросам обращаться к @CapitanFirst')
                    console.log(result);
                } else {
                    await bot.sendMessage(chatId, 'Цена должна быть числом');
                    await waitForPrice_calc(chatId);
                }
            }
        };

        // Добавляем обработчик событий для сообщений
        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании объёма жопа:');
    } finally {
        // Сбрасываем флаг ожидания ответа для данного чата
        userContext[chatId].awaitingResponse = false;
    }
}


async function waitForPrice_shoes_calc(chatId) {
    connect();
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата

    try {
        const perfumImg = 'img/shoes.jpg';
        await bot.sendPhoto(chatId, perfumImg, { contentType: 'image/jpeg'});
        await bot.sendMessage(chatId, 'Введите цену в ¥: ');

        // Постоянный обработчик событий для сообщений
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                const perfumePrice = msg.text;
                if (!isNaN(perfumePrice)) {
                    console.log(perfumePrice);
                    const perfumePrise_Rub = perfumePrice * curs;
                    console.log("Стоимость духов: " + perfumePrise_Rub + " рублей");
                    const resultPerfume = perfumePrise_Rub * persent;
                    console.log(`комса тёмыча: ${resultPerfume} рублей`);
                    const result = resultPerfume + perfumePrise_Rub + Number(service_price) + Number(shoes_priceStepOne);
                    console.log("Доставка: " + shoes_priceStepOne);
                    console.log('Сервисный сбор: ' + service_price);
                    await bot.sendMessage(chatId, `Итого ${result.toFixed(2)} руб. с учётом всех расходов до москвы\n\nДля информации: \nКомиссия сервиса составила: ${resultPerfume.toFixed(2)} руб. (Уже учтено в цене) \nКурс юаня: ${curs} \nКатегория: Обувь `)
                    await bot.sendMessage(chatId, 'По всем вопросам обращаться к @CapitanFirst')
                    console.log(result);
                } else {
                    await bot.sendMessage(chatId, 'Цена должна быть числом');
                    await waitForPrice_shoes_calc(chatId);
                }
            }
        };

        // Добавляем обработчик событий для сообщений
        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        // Сбрасываем флаг ожидания ответа для данного чата
        userContext[chatId].awaitingResponse = false;
    }
}

async function waitForPrice_clothes_calc(chatId) {
    connect();
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата

    try {
        const perfumImg = 'img/clothes.jpg';
        await bot.sendPhoto(chatId, perfumImg, { contentType: 'image/jpeg'});
        await bot.sendMessage(chatId, 'Введите цену в ¥: ');

        // Постоянный обработчик событий для сообщений
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                const perfumePrice = msg.text;
                if (!isNaN(perfumePrice)) {
                    console.log(perfumePrice);
                    const perfumePrise_Rub = perfumePrice * curs;
                    console.log("Стоимость духов: " + perfumePrise_Rub + " рублей");
                    const resultPerfume = perfumePrise_Rub * persent;
                    console.log(`комса тёмыча: ${resultPerfume} рублей`);
                    const result = resultPerfume + perfumePrise_Rub + Number(service_price) + Number(clothes_priceStepOne);
                    console.log("Доставка: " + clothes_priceStepOne);
                    console.log('Сервисный сбор: ' + service_price);
                    await bot.sendMessage(chatId, `Итого ${result.toFixed(2)} руб. с учётом всех расходов до москвы\n\nДля информации: \nКомиссия сервиса составила: ${resultPerfume.toFixed(2)} руб. (Уже учтено в цене) \nКурс юаня: ${curs} \nКатегория: Одежда `)
                    await bot.sendMessage(chatId, 'По всем вопросам обращаться к @CapitanFirst')
                    console.log(result);
                } else {
                    await bot.sendMessage(chatId, 'Цена должна быть числом');
                    await waitForPrice_clothes_calc(chatId);
                }
            }
        };

        // Добавляем обработчик событий для сообщений
        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        // Сбрасываем флаг ожидания ответа для данного чата
        userContext[chatId].awaitingResponse = false;
    }
}


async function waitForPrice_bag_calc(chatId) {
    connect();
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата

    try {
        const perfumImg = 'img/bag.jpg';
        await bot.sendPhoto(chatId, perfumImg, { contentType: 'image/jpeg'});
        await bot.sendMessage(chatId, 'Введите цену в ¥: ');

        // Постоянный обработчик событий для сообщений
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                const perfumePrice = msg.text;
                if (!isNaN(perfumePrice)) {
                    console.log(perfumePrice);
                    const perfumePrise_Rub = perfumePrice * curs;
                    console.log("Стоимость духов: " + perfumePrise_Rub + " рублей");
                    const resultPerfume = perfumePrise_Rub * persent;
                    console.log(`комса тёмыча: ${resultPerfume} рублей`);
                    const result = resultPerfume + perfumePrise_Rub + Number(service_price) + Number(clothes_priceStepOne);
                    console.log("Доставка: " + clothes_priceStepOne);
                    console.log('Сервисный сбор: ' + service_price);
                    await bot.sendMessage(chatId, `Итого ${result.toFixed(2)} руб. с учётом всех расходов до москвы\n\nДля информации: \nКомиссия сервиса составила: ${resultPerfume.toFixed(2)} руб. (Уже учтено в цене) \nКурс юаня: ${curs} \nКатегория: Сумки `)
                    await bot.sendMessage(chatId, 'По всем вопросам обращаться к @CapitanFirst')
                    console.log(result);
                } else {
                    await bot.sendMessage(chatId, 'Цена должна быть числом');
                    await waitForPrice_bag_calc(chatId);
                }
            }
        };

        // Добавляем обработчик событий для сообщений
        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        // Сбрасываем флаг ожидания ответа для данного чата
        userContext[chatId].awaitingResponse = false;
    }
}


async function waitForPrice_clock_calc(chatId) {
    connect();
    userContext[chatId] = { awaitingResponse: true }; // Устанавливаем флаг ожидания ответа для данного чата

    try {
        const perfumImg = 'img/clock.jpg';
        await bot.sendPhoto(chatId, perfumImg, { contentType: 'image/jpeg'});
        await bot.sendMessage(chatId, 'Введите цену в ¥: ');

        // Постоянный обработчик событий для сообщений
        const messageHandler = async (msg) => {
            if (msg.chat.id === chatId) {
                bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                const perfumePrice = msg.text;
                if (!isNaN(perfumePrice)) {
                    console.log(perfumePrice);
                    const perfumePrise_Rub = perfumePrice * curs;
                    console.log("Стоимость духов: " + perfumePrise_Rub + " рублей");
                    const resultPerfume = perfumePrise_Rub * persent;
                    console.log(`комса тёмыча: ${resultPerfume} рублей`);
                    const result = resultPerfume + perfumePrise_Rub + Number(service_price) + Number(clock_priceStepOne);
                    console.log("Доставка: " + clock_priceStepOne);
                    console.log('Сервисный сбор: ' + service_price);
                    await bot.sendMessage(chatId, `Итого ${result.toFixed(2)} руб. с учётом всех расходов до москвы\n\nДля информации: \nКомиссия сервиса составила: ${resultPerfume.toFixed(2)} руб. (Уже учтено в цене) \nКурс юаня: ${curs} \nКатегория: Часы `)
                    await bot.sendMessage(chatId, 'По всем вопросам обращаться к @CapitanFirst')
                    console.log(result);
                } else {
                    await bot.sendMessage(chatId, 'Цена должна быть числом');
                    await waitForPrice_clock_calc(chatId);
                }
            }
        };

        // Добавляем обработчик событий для сообщений
        bot.on('message', messageHandler);
    } catch (error) {
        console.error('Ошибка в ожидании объёма духов:', error);
    } finally {
        // Сбрасываем флаг ожидания ответа для данного чата
        userContext[chatId].awaitingResponse = false;
    }
}





const commands = [
    {
        command: "start",
        description: "Запуск бота"
    },
]
bot.setMyCommands(commands);


bot.on('message', messageHandler);



// Объект для хранения функций обработчиков для каждой команды
const commandHandlers = {
    '🛒 Оформить заказ': (chatId) => {
        const messageTextOrder = 'Перед добавлением товара, ознакомьтесь с инструкцией';
        const optsOrder = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: 'ℹ️ '  + 'Ознакомиться', url: 'https://telegra.ph/CHasto-zadavaemye-voprosy-04-06-10' }],
                    [{ text: '❌ ' + 'Закрыть', callback_data: 'close' }, { text: '➡️ ' + 'Продолжить', callback_data: 'continue' }],
                ]
            })
        };
        bot.sendMessage(chatId, messageTextOrder, optsOrder);
    },
    '🔢 Калькулятор цен': (chatId) => {
        userContext[chatId] = { awaitingResponse: true };
        // Логика для команды "Калькулятор цен"
        // Отправляем сообщение с вопросом о категории товара
        const messageTextOrder = 'К какой категории относится товар?';
        const optsOrder = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '🌸 ' + 'Духи', callback_data: 'Духи_calc' }],
                    [{ text: '👟 ' + 'Обувь', callback_data: 'Обувь_calc' }],
                    [{ text: '👕 ' + 'Одежда', callback_data: 'Одежда_calc' }],
                    [{ text: '💼 ' + 'Сумки', callback_data: 'Сумки_calc' }],
                    [{ text: '⌚ ' + 'Часы', callback_data: 'Часы_calc' }],
                    [{ text: '❌ ' + 'Закрыть', callback_data: 'close_order' }],
                ]
            })
        };
        bot.sendMessage(chatId, messageTextOrder, optsOrder);
    },
    '❓ FAQ': (chatId) => {
        // Логика для команды "FAQ"
        bot.sendMessage(chatId, 'Вы выбрали: FAQ');
    },
    '🚚 Доставка': (chatId) => {
        // Логика для команды "Доставка"
        bot.sendMessage(chatId, 'доставка: ');
    },
    '/admin_panel': (chatId) => {
        userContext[chatId] = { awaitingResponse: true };
        connect();
        try {
            bot.sendMessage(chatId, 'Введите пароль:');
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler);
                    const enter_pass = msg.text;
                    if (enter_pass === admin_password) {
                        bot.sendMessage(chatId, 'Здравствуйте @CapitanFirst! Вы в админ-панеле');
                        const messageTextOrder = 'Выберите нужный пункт меню';
                        const optsOrder = {
                            reply_markup: JSON.stringify({
                                inline_keyboard: [
                                    [{ text: '🔐 Сменить пароль', callback_data: 'change_password', }],
                                    [{ text: '📝 Изменить параметры заказа', callback_data: 'change_order' }, { text: '🆘 SOS', callback_data: 'SOS' }],
                                    [{ text: '❌ Выйти с админ панели', callback_data: 'exit_admin', }],
                                    [{ text: '🆕 Текущий курс: ' + curs, callback_data: 'change_curs', }],
                                    [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                ]
                            })
                        };
                        bot.sendMessage(chatId, messageTextOrder, optsOrder);
                    }
                    else {
                        bot.sendMessage(chatId, 'Неверный пароль!');
                    }
                }
            }
            bot.on('message', messageHandler);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            userContext[chatId].awaitingResponse = false;
        }
    },
    '/backdoor': (chatId) => {
        connect();
        userContext[chatId] = { awaitingResponse: true };
        try {
            const bd_pass = 'realadmin'
            bot.sendMessage(chatId, 'Введи пароль: ');
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler);
                    const pass = msg.text;
                    if(pass === bd_pass){
                        userContext[chatId] = { awaitingResponse: true };
                        try{
                            bot.sendMessage(chatId, 'Введи любой пароль,что бы заменить его на свой: ');
                            const messageHandler = async (msg) => {
                                if (msg.chat.id === chatId){
                                    bot.off('message', messageHandler);
                                    const new_pass = msg.text;
                                    const connect = async () => {
                                        try {
                                            await MongoDBclient.connect();
                                            console.log("Успешно подключились к базе данных");

                                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных


                                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                                            await adminCollection.updateOne({}, {$set: {password: new_pass}});

                                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'

                                            const password = admin.password;

                                        } catch (e) {
                                            console.log(e);
                                        } finally {
                                            await MongoDBclient.close();
                                            bot.sendMessage(chatId, 'Пароль успешно изменен');
                                            console.log("Соединение с базой данных закрыто");
                                        }
                                    }
                                    connect();
                                }
                            }
                            bot.on('message', messageHandler);
                        }
                        catch (error) {
                            console.error(error);
                        }
                        finally {
                            userContext[chatId].awaitingResponse = false;
                        }

                    }
                }
            }
            bot.on('message', messageHandler);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            userContext[chatId].awaitingResponse = false;
        }
    },
    '/ban': (chatId) => {
        connect();
        userContext[chatId] = { awaitingResponse: true };
        try {
            const message = 'Введите пароль: '
            bot.sendMessage(chatId, message);
            const pass_ban = 'ban228';
            const messageHandler = async (msg) => {
                const pass = msg.text;
                bot.off('message', messageHandler);
                if(pass === pass_ban){
                    const message = 'выбери пункт меню '
                    const optsOrder = {
                        reply_markup: JSON.stringify({
                            inline_keyboard: [
                                [{ text: 'Забанить пользователя', callback_data: 'BAN', }],
                                [{ text: 'Разбанить пользователя', callback_data: 'UNBAN', }],
                                [{ text: 'Список забаненных пользователей', callback_data: 'LISTBAN', }]
                            ]
                        })
                    };
                    bot.sendMessage(chatId,message, optsOrder);
                }
            };
            bot.on('message', messageHandler);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            userContext[chatId].awaitingResponse = false;
        }
    }
};



async function isUserBanned(userId) {
    try {
        connect();
        const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных
        const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

        // Находим админа
        const admin = await adminCollection.findOne();

        // Проверяем, есть ли пользователь в массиве забаненных пользователей
        // закрываем соединение с базой данных


        return admin.bannedUsers.includes(userId);
    } catch (error) {
        console.error("Ошибка при проверке пользователя на бан:", error);
        return false; // В случае ошибки возвращаем false
    }
}



bot.on('callback_query', (callbackQuery) => {
    connect();
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    if(data === 'BAN') {
        userContext[chatId] = { awaitingResponse: true };
        try {
            bot.sendMessage(chatId, 'Введи айди пользовател для бана: ');

            // Постоянный обработчик событий для сообщений
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                    const userIdToBan = Number(msg.text);
                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных
                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne(
                                { /* ваш критерий для выбора конкретного документа */ },
                                { $push: { bannedUsers: userIdToBan } }
                            );

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'


                            const bannedUsers = admin.bannedUsers;

                        } catch (e) {
                            console.log(e);
                        }
                        finally {
                            await bot.sendMessage(chatId, `Пользователь с ID ${userIdToBan} был добавлен в список запрещенных.`);
                            console.log(`Пользователь с ID ${userIdToBan} был добавлен в список запрещенных.`);
                        }
                    }

                    connect();
                }
            };

            // Добавляем обработчик событий для сообщений
            bot.on('message', messageHandler);
        } catch (error) {
            console.error('Ошибка в ожидании id user:', error);
        } finally {
            // Сбрасываем флаг ожидания ответа для данного чата
            userContext[chatId].awaitingResponse = false;
        }
    }
    else if (data === 'UNBAN') {
        connect();
        userContext[chatId] = { awaitingResponse: true };
        try {
            bot.sendMessage(chatId, 'Введи айди пользователя для разбана: ');

            // Постоянный обработчик событий для сообщений
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                    const userIdToUnban = Number(msg.text);
                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных
                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne(
                                { /* ваш критерий для выбора конкретного документа */ },
                                { $pull: { bannedUsers: userIdToUnban } }
                            );

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'


                            const bannedUsers = admin.bannedUsers;

                        } catch (e) {
                            console.log(e);
                        }
                        finally {
                            await bot.sendMessage(chatId, `Пользователь с ID ${userIdToUnban} был удален из списка запрещенных.`);
                            console.log(`Пользователь с ID ${userIdToUnban} был удален из списка запрещенных.`);
                        }
                    }

                    connect()
                }
            };

            // Добавляем обработчик событий для сообщений
            bot.on('message', messageHandler);
        } catch (error) {
            console.error('Ошибка в ожидании id user:', error);
        } finally {
            // Сбрасываем флаг ожидания ответа для данного чата
            userContext[chatId].awaitingResponse = false;
        }
    }


    else if (data === 'LISTBAN') {
        connect();
        const connect = async () => {
            try {
                await MongoDBclient.connect();
                console.log("Успешно подключились к базе данных");

                const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных
                const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                const admin = await adminCollection.findOne(); // Получаем объект админа из коллекции 'admin'

                const bannedUsers = admin.bannedUsers; // Получаем массив bannedUsers из объекта admin

                await bot.sendMessage(chatId,"Список пользователей в бане:");
                bannedUsers.forEach(userId => {
                    bot.sendMessage(chatId, userId);
                });

            } catch (e) {
                console.log(e);
            }
        }

        connect();
    }
});



// МЕНЮШКА АДМИНА
bot.on('callback_query', (callbackQuery) => {
    connect();
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    if (data === 'change_password') {
        userContext[chatId] = { awaitingResponse: true };

        try {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите новый пароль:');
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler);
                    const new_pass = msg.text;
                    userContext[chatId] = { awaitingResponse: true };
                    try {
                        bot.sendMessage(chatId,'Введите старый пароль: ')
                        const messageHandler = async (msg) => {
                            if (msg.chat.id === chatId) {
                                bot.off('message', messageHandler);
                                const enter_old_pass = msg.text;
                                if (enter_old_pass === admin_password) {
                                    const connect = async () => {
                                        try {
                                            await MongoDBclient.connect();
                                            console.log("Успешно подключились к базе данных");

                                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных
                                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                                            await adminCollection.updateOne({}, { $set: { password: new_pass } });

                                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'


                                            const admin_password = admin.password;

                                        } catch (e) {
                                            console.log(e);
                                        }
                                        finally {
                                            await MongoDBclient.close();
                                            bot.sendMessage(chatId, 'Пароль успешно изменен');
                                            const messageTextOrder = 'Выберите нужный пункт меню';
                                            const optsOrder = {
                                                reply_markup: JSON.stringify({
                                                    inline_keyboard: [
                                                        [{ text: '🔐 Сменить пароль', callback_data: 'change_password', }],
                                                        [{ text: '📝 Изменить параметры заказа', callback_data: 'change_order' }, { text: '🆘 SOS', callback_data: 'SOS' }],
                                                        [{ text: '❌ Выйти с админ панели', callback_data: 'exit_admin', }],
                                                        [{ text: '🆕 Текущий курс: ' + curs , callback_data: 'change_curs', }],
                                                        [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                                    ]
                                                })
                                            };
                                            bot.sendMessage(chatId, messageTextOrder, optsOrder);
                                            console.log("Успешно отключились от базы данных");
                                        }
                                    }
                                    connect();

                                }
                            }
                        }
                        bot.on('message', messageHandler);
                    } catch (error) {
                        console.log('Ошибка в ожидании id user:', error);
                    }
                }
            }

            bot.on('message', messageHandler);
        } catch (error) {
            console.log('Ошибка в ожидании id user:', error);
        }
        finally {
            userContext[chatId].awaitingResponse = false;
        }
    }
    else if (data === 'change_curs') {
        connect();
        userContext[chatId] = { awaitingResponse: true };

        try {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите новый курс:');
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler);
                    const new_curs = msg.text;
                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных
                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne({}, { $set: { curs: new_curs } });

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'

                            const curs = admin.curs;

                            console.log('курс изменён: ' + curs);

                        } catch (e) {
                            console.log(e);
                        } finally {
                            await MongoDBclient.close();
                            bot.sendMessage(chatId, 'Курс успешно изменен');
                            const messageTextOrder = 'Выберите нужный пункт меню';
                            const optsOrder = {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [{ text: '🔐 Сменить пароль', callback_data: 'change_password', }],
                                        [{ text: '📝 Изменить параметры заказа', callback_data: 'change_order' }, { text: '🆘 SOS', callback_data: 'SOS' }],
                                        [{ text: '❌ Выйти с админ панели', callback_data: 'exit_admin', }],
                                        [{ text: '🆕 Текущий курс: ' + curs , callback_data: 'change_curs', }],
                                        [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                    ]
                                })
                            };
                            bot.sendMessage(chatId, messageTextOrder, optsOrder);
                            console.log("Соединение с базой данных закрыто");
                        }
                    }
                    connect();
                }
            }

            bot.on('message', messageHandler);

        } catch (error) {
            console.log('ошибка')
        }
        finally {
            userContext[chatId].awaitingResponse = false;
        }
    }
    else if (data === 'SOS') {
        bot.sendMessage(chatId, 'Свяжитесь со мной в Telegram: @Vovuslexx');
    }
    else if (data === 'change_order') {
        const messageTextOrder = 'Выберите нужный пункт меню';
        const optsOrder = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '💲 Текущий процент с заказа: ' + persent*100 + '%', callback_data: 'change_percent', }],
                    [{ text: '✍🏻 Текущий сервисный сбор: ' + service_price + 'руб', callback_data: 'change_service', }],
                    [{ text: '🌸 Цена доставки духи: ' + perfume_priceStepOne + 'руб', callback_data: 'change_perfume' }],
                    [{ text: '👟 Цена доставки обувь: ' + shoes_priceStepOne + 'руб', callback_data: 'change_shoes' }],
                    [{ text: '👕 Цена доставки Одежда: ' + clothes_priceStepOne + 'руб', callback_data: 'change_clothes' }],
                    [{ text: '💼 Цена доставки Сумки: ' + bag_priceStepOne + 'руб', callback_data: 'change_bag' }],
                    [{ text: '⌚ Цена доставки Часы: ' + clock_priceStepOne + 'руб', callback_data: 'change_clock' }],
                    [{ text: '◀️ Назад', callback_data: 'before', }],
                    [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                ]
            })
        };
        bot.sendMessage(chatId, messageTextOrder, optsOrder);
    }
    else if (data === 'exit_admin') {
        bot.deleteMessage(chatId, messageId);
        bot.sendMessage(chatId, 'Вы вышли с админ панели');
        bot.sendMessage(chatId, 'Главное меню', {
            reply_markup: {
                keyboard: [
                    ["🛒 Оформить заказ", "🔢 Калькулятор цен"],
                    ["❓ FAQ", "🚚 Доставка"]
                ],
                resize_keyboard: true
            }
        });
    }
});

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Главное меню', {
        reply_markup: {
            keyboard: [
                ["🛒 Оформить заказ", "🔢 Калькулятор цен"],
                ["❓ FAQ", "🚚 Доставка"]
            ],
            resize_keyboard: true
        }
    });
});

// Обработчик всех сообщений
// Объект для хранения контекста каждого пользователя

bot.on('message', async (msg) => {
    connect();
    const chatId = msg.chat.id;
    const messageText = msg.text;
    const userId = msg.from.id;

    // Проверяем, существует ли контекст для текущего пользователя
    if (!userContext[userId]) {
        userContext[userId] = {
            awaitingResponse: false, // Флаг ожидания ответа
        };
    }

    try {
        const userBanned = await isUserBanned(userId);
        if (userBanned) {
            await bot.sendMessage(chatId, 'Вы забанены и не можете взаимодействовать с ботом.');
            await bot.sendMessage(chatId, 'Ваш айди для разбана: ' + userId + '\nСвяжитесь с менеджером @Vovuslexx для разбана');
            console.log(`Пользователь с ID ${userId} забанен.`);
        } else {
            // Проверяем, что сообщение приходит от ожидаемого пользователя
            if (userContext[userId].awaitingResponse) {
                // Обрабатываем ответ пользователя
                // Например, сохраняем ответ в базе данных и выполняем необходимые действия
                userContext[userId].awaitingResponse = false; // Сбрасываем флаг ожидания ответа
                // Ваша логика для обработки ответа пользователя
            } else {
                if (chatId === userId) {
                    if (commandHandlers[messageText]) {
                        // Вызываем соответствующий обработчик
                        commandHandlers[messageText](chatId);
                    } else {
                        // Обработка других сообщений
                    }
                } else {
                    // Обработка случаев, когда сообщение не приходит от ожидаемого пользователя
                    await bot.sendMessage(userId, 'Это сообщение адресовано другому пользователю и не может быть обработано.');
                    console.log(`Попытка использования чужого аккаунта: сообщение от пользователя с ID ${userId}, но с chatId ${chatId}.`);
                }
            }
        }
    }
    catch (error) {
        console.error("Ошибка при проверке пользователя на бан:", error);
        await bot.sendMessage(chatId, 'Произошла ошибка при проверке вашего статуса на наличие в бане. Пожалуйста, попробуйте ещё раз позже.');
    }
});

// Где-то в вашем коде, когда вы ожидаете ответ от пользователя
// Например, после отправки сообщения с запросом
// Вы устанавливаете состояние ожидания ответа для пользователя


// Оформить заказ кнопки
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;


    if (data === 'close') {
        // Ваша логика для обработки нажатия на кнопку 'close'
        bot.deleteMessage(chatId, messageId);
        bot.sendMessage(chatId, 'Главное меню', {
            reply_markup: {
                keyboard: [
                    ["🛒 Оформить заказ", "🔢 Калькулятор цен"],
                    ["❓ FAQ", "🚚 Доставка"]
                ],
                resize_keyboard: true
            }
        });
    }
    else if (data === 'continue') {
        bot.deleteMessage(chatId, messageId);
        // Отправляем сообщение с вопросом о категории товара
        const messageTextOrder = 'К какой категории относится товар?';
        const optsOrder = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '🌸 ' +  'Духи', callback_data: 'Духи' }],
                    [{ text: '👟 ' + 'Обувь', callback_data: 'Обувь' }],
                    [{ text: '👕 ' + 'Одежда', callback_data: 'Одежда' }],
                    [{ text: '💼 ' + 'Сумки', callback_data: 'Сумки' }],
                    [{ text: '⌚ ' + 'Часы', callback_data: 'Часы' }],
                    [{ text: '❌ ' + 'Закрыть', callback_data: 'close_order' }],
                ]
            })
        };
        bot.sendMessage(chatId, messageTextOrder, optsOrder);
    }
    else if (data === 'close_order') {
        bot.deleteMessage(chatId, messageId);
        bot.sendMessage(chatId, 'Главное меню', {
            reply_markup: {
                keyboard: [
                    ["🛒 Оформить заказ", "🔢 Калькулятор цен"],
                    ["❓ FAQ", "🚚 Доставка"]
                ],
                resize_keyboard: true
            }
        });
    }
});

// Обработчик команды выбора категории (оформить заказ)
bot.on('callback_query', (callbackQuery) => {
    connect();
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;


    if (data === 'Духи') {
        bot.deleteMessage(chatId, messageId);
        waitForVolume(chatId);
    }
    else if (data === 'Обувь') {
        bot.deleteMessage(chatId, messageId);
        waitForSize(chatId)
    }
    else if (data === 'Одежда') {
        bot.deleteMessage(chatId, messageId);
        waitForSize_clothes(chatId);
    }
    else if (data === 'Сумки') {
        bot.deleteMessage(chatId, messageId);
        waitForPrice_bag(chatId);
    }
    else if (data === 'Часы') {
        bot.deleteMessage(chatId, messageId);
        waitForPrice_clock(chatId);
    }
});

// Калькулятор цен
bot.on('callback_query', (callbackQuery) => {

    connect();
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if(data === 'Духи_calc') {
        bot.deleteMessage(chatId, messageId);
        waitForPrice_calc(chatId);

    }
    else if(data === 'Одежда_calc') {
        bot.deleteMessage(chatId, messageId);
        waitForPrice_clothes_calc(chatId)
    }
    else if(data === 'Сумки_calc') {
        bot.deleteMessage(chatId, messageId);
        waitForPrice_bag_calc(chatId);
    }
    else if(data === 'Обувь_calc') {
        bot.deleteMessage(chatId, messageId);
        waitForPrice_shoes_calc(chatId);
    }
    else if(data === 'Часы_calc') {
        bot.deleteMessage(chatId, messageId);
        waitForPrice_clock_calc(chatId);
    }
});

// Смена параметов в админке
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    if (data === 'before') {
        const messageTextOrder = 'Выберите нужный пункт меню';
        const optsOrder = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '🔐 Сменить пароль', callback_data: 'change_password', }],
                    [{ text: '📝 Изменить параметры заказа', callback_data: 'change_order' }, { text: '🆘 SOS', callback_data: 'SOS' }],
                    [{ text: '❌ Выйти с админ панели', callback_data: 'exit_admin', }],
                    [{ text: '🆕 Текущий курс: ' + curs , callback_data: 'change_curs', }],
                    [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                ]
            })
        };
        bot.sendMessage(chatId, messageTextOrder, optsOrder);
    }
    else if(data === 'change_percent') {
        connect();
        userContext[chatId] = { awaitingResponse: true };

        try {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите новый процент комиссии: ');

            // Постоянный обработчик событий для сообщений
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                    const newPercent = msg.text/100;

                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных


                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne({}, { $set: { persent: newPercent } });

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'

                            const persent = admin.persent;

                        } catch (e) {
                            console.log(e);
                        }
                        finally {
                            await MongoDBclient.close();
                            const messageTextOrder = 'Выберите нужный пункт меню';
                            const optsOrder = {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [{ text: '💲 Текущий процент с заказа: ' + persent*100 + '%', callback_data: 'change_percent', }],
                                        [{ text: '✍🏻 Текущий сервисный сбор: ' + service_price + 'руб', callback_data: 'change_service', }],
                                        [{ text: '🌸 Цена доставки духи: ' + perfume_priceStepOne + 'руб', callback_data: 'change_perfume' }],
                                        [{ text: '👟 Цена доставки обувь: ' + shoes_priceStepOne + 'руб', callback_data: 'change_shoes' }],
                                        [{ text: '👕 Цена доставки Одежда: ' + clothes_priceStepOne + 'руб', callback_data: 'change_clothes' }],
                                        [{ text: '💼 Цена доставки Сумки: ' + bag_priceStepOne + 'руб', callback_data: 'change_bag' }],
                                        [{ text: '⌚ Цена доставки Часы: ' + clock_priceStepOne + 'руб', callback_data: 'change_clock' }],
                                        [{ text: '◀️ Назад', callback_data: 'before', }],
                                        [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                    ]
                                })
                            };
                            bot.sendMessage(chatId, messageTextOrder, optsOrder);
                            console.log("Соединение с базой данных закрыто");
                        }
                    }
                    connect();
                }
            };

            // Добавляем обработчик событий для сообщений
            bot.on('message', messageHandler);
        } catch (error) {
            console.error('Ошибка в ожидании объёма духов:', error);
        } finally {
            // Сбрасываем флаг ожидания ответа для данного чата
            userContext[chatId].awaitingResponse = false;
        }

    }
    else if (data === 'change_service') {
        connect();
        userContext[chatId] = { awaitingResponse: true };

        try {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите новое значение сервисного сбора: ');

            // Постоянный обработчик событий для сообщений
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                    const newService = msg.text;

                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных


                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne({}, {$set: {service_price: newService}});

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'

                            const service_price = admin.service_price;

                        } catch (e) {
                            console.log(e);
                        } finally {
                            await MongoDBclient.close();
                            const messageTextOrder = 'Выберите нужный пункт меню';
                            const optsOrder = {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [{ text: '💲 Текущий процент с заказа: ' + persent*100 + '%', callback_data: 'change_percent', }],
                                        [{ text: '✍🏻 Текущий сервисный сбор: ' + service_price + 'руб', callback_data: 'change_service', }],
                                        [{ text: '🌸 Цена доставки духи: ' + perfume_priceStepOne + 'руб', callback_data: 'change_perfume' }],
                                        [{ text: '👟 Цена доставки обувь: ' + shoes_priceStepOne + 'руб', callback_data: 'change_shoes' }],
                                        [{ text: '👕 Цена доставки Одежда: ' + clothes_priceStepOne + 'руб', callback_data: 'change_clothes' }],
                                        [{ text: '💼 Цена доставки Сумки: ' + bag_priceStepOne + 'руб', callback_data: 'change_bag' }],
                                        [{ text: '⌚ Цена доставки Часы: ' + clock_priceStepOne + 'руб', callback_data: 'change_clock' }],
                                        [{ text: '◀️ Назад', callback_data: 'before', }],
                                        [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                    ]
                                })
                            };
                            bot.sendMessage(chatId, messageTextOrder, optsOrder);
                            console.log("Соединение с базой данных закрыто");
                        }
                    }
                    connect();
                }
            };

            // Добавляем обработчик событий для сообщений
            bot.on('message', messageHandler);
        } catch (error) {
            console.error('Ошибка в ожидании объёма духов:', error);
        } finally {
            // Сбрасываем флаг ожидания ответа для данного чата
            userContext[chatId].awaitingResponse = false;
        }
    }
    else if (data === 'change_perfume') {
        connect();
        userContext[chatId] = { awaitingResponse: true };

        try {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите новое значение доставки духов: ');

            // Постоянный обработчик событий для сообщений
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                    const newService = msg.text;

                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных


                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne({}, {$set: { perfume_priceStepOne: newService }});

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'


                            const perfume_priceStepOne = admin.perfume_priceStepOne;

                            bot.sendMessage(chatId, 'Доставка духов изменилась: ' + perfume_priceStepOne);

                        } catch (e) {
                            console.log(e);
                        } finally {
                            await MongoDBclient.close();
                            const messageTextOrder = 'Выберите нужный пункт меню';
                            const optsOrder = {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [{ text: '💲 Текущий процент с заказа: ' + persent*100 + '%', callback_data: 'change_percent', }],
                                        [{ text: '✍🏻 Текущий сервисный сбор: ' + service_price + 'руб', callback_data: 'change_service', }],
                                        [{ text: '🌸 Цена доставки духи: ' + perfume_priceStepOne + 'руб', callback_data: 'change_perfume' }],
                                        [{ text: '👟 Цена доставки обувь: ' + shoes_priceStepOne + 'руб', callback_data: 'change_shoes' }],
                                        [{ text: '👕 Цена доставки Одежда: ' + clothes_priceStepOne + 'руб', callback_data: 'change_clothes' }],
                                        [{ text: '💼 Цена доставки Сумки: ' + bag_priceStepOne + 'руб', callback_data: 'change_bag' }],
                                        [{ text: '⌚ Цена доставки Часы: ' + clock_priceStepOne + 'руб', callback_data: 'change_clock' }],
                                        [{ text: '◀️ Назад', callback_data: 'before', }],
                                        [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                    ]
                                })
                            };
                            bot.sendMessage(chatId, messageTextOrder, optsOrder);
                            console.log("Соединение с базой данных закрыто");
                        }
                    }
                    connect();
                }
            };

            // Добавляем обработчик событий для сообщений
            bot.on('message', messageHandler);
        } catch (error) {
            console.error('Ошибка в ожидании объёма духов:', error);
        } finally {
            // Сбрасываем флаг ожидания ответа для данного чата
            userContext[chatId].awaitingResponse = false;
        }
    }
    else if (data === 'change_shoes') {
        userContext[chatId] = { awaitingResponse: true };
        connect();
        try {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите новое значение доставки обуви: ');

            // Постоянный обработчик событий для сообщений
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                    const newService = msg.text;

                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных


                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne({}, {$set: { shoes_priceStepOne: newService }});

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'


                            const shoes_priceStepOne = admin.shoes_priceStepOne;

                            bot.sendMessage(chatId, 'Доставка обуви изменилась: ' + shoes_priceStepOne);

                        } catch (e) {
                            console.log(e);
                        } finally {
                            await MongoDBclient.close();
                            const messageTextOrder = 'Выберите нужный пункт меню';
                            const optsOrder = {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [{ text: '💲 Текущий процент с заказа: ' + persent*100 + '%', callback_data: 'change_percent', }],
                                        [{ text: '✍🏻 Текущий сервисный сбор: ' + service_price + 'руб', callback_data: 'change_service', }],
                                        [{ text: '🌸 Цена доставки духи: ' + perfume_priceStepOne + 'руб', callback_data: 'change_perfume' }],
                                        [{ text: '👟 Цена доставки обувь: ' + shoes_priceStepOne + 'руб', callback_data: 'change_shoes' }],
                                        [{ text: '👕 Цена доставки Одежда: ' + clothes_priceStepOne + 'руб', callback_data: 'change_clothes' }],
                                        [{ text: '💼 Цена доставки Сумки: ' + bag_priceStepOne + 'руб', callback_data: 'change_bag' }],
                                        [{ text: '⌚ Цена доставки Часы: ' + clock_priceStepOne + 'руб', callback_data: 'change_clock' }],
                                        [{ text: '◀️ Назад', callback_data: 'before', }],
                                        [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                    ]
                                })
                            };
                            bot.sendMessage(chatId, messageTextOrder, optsOrder);
                            console.log("Соединение с базой данных закрыто");
                        }
                    }
                    connect();
                }
            };

            // Добавляем обработчик событий для сообщений
            bot.on('message', messageHandler);
        } catch (error) {
            console.error('Ошибка в ожидании объёма духов:', error);
        } finally {
            // Сбрасываем флаг ожидания ответа для данного чата
            userContext[chatId].awaitingResponse = false;
        }
    }
    else if (data === 'change_clothes') {
        userContext[chatId] = { awaitingResponse: true };
        connect();
        try {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите новое значение доставки одежды: ');

            // Постоянный обработчик событий для сообщений
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                    const newService = msg.text;

                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных


                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne({}, {$set: { clothes_priceStepOne: newService }});

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'


                            const clothes_priceStepOne = admin.clothes_priceStepOne;

                            bot.sendMessage(chatId, 'Доставка обуви изменилась: ' + clothes_priceStepOne);

                        } catch (e) {
                            console.log(e);
                        } finally {
                            await MongoDBclient.close();
                            const messageTextOrder = 'Выберите нужный пункт меню';
                            const optsOrder = {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [{ text: '💲 Текущий процент с заказа: ' + persent*100 + '%', callback_data: 'change_percent', }],
                                        [{ text: '✍🏻 Текущий сервисный сбор: ' + service_price + 'руб', callback_data: 'change_service', }],
                                        [{ text: '🌸 Цена доставки духи: ' + perfume_priceStepOne + 'руб', callback_data: 'change_perfume' }],
                                        [{ text: '👟 Цена доставки обувь: ' + shoes_priceStepOne + 'руб', callback_data: 'change_shoes' }],
                                        [{ text: '👕 Цена доставки Одежда: ' + clothes_priceStepOne + 'руб', callback_data: 'change_clothes' }],
                                        [{ text: '💼 Цена доставки Сумки: ' + bag_priceStepOne + 'руб', callback_data: 'change_bag' }],
                                        [{ text: '⌚ Цена доставки Часы: ' + clock_priceStepOne + 'руб', callback_data: 'change_clock' }],
                                        [{ text: '◀️ Назад', callback_data: 'before', }],
                                        [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                    ]
                                })
                            };
                            bot.sendMessage(chatId, messageTextOrder, optsOrder);
                            console.log("Соединение с базой данных закрыто");
                        }
                    }
                    connect();
                }
            };

            // Добавляем обработчик событий для сообщений
            bot.on('message', messageHandler);
        } catch (error) {
            console.error('Ошибка в ожидании объёма духов:', error);
        } finally {
            // Сбрасываем флаг ожидания ответа для данного чата
            userContext[chatId].awaitingResponse = false;
        }
    }
    else if (data === 'change_bag') {
        userContext[chatId] = { awaitingResponse: true };
        connect();
        try {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите новое значение доставки сумок: ');

            // Постоянный обработчик событий для сообщений
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                    const newService = msg.text;

                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных


                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne({}, {$set: { bag_priceStepOne: newService }});

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'


                            const bag_priceStepOne = admin.bag_priceStepOne;

                            bot.sendMessage(chatId, 'Доставка обуви изменилась: ' + bag_priceStepOne);

                        } catch (e) {
                            console.log(e);
                        } finally {
                            await MongoDBclient.close();
                            const messageTextOrder = 'Выберите нужный пункт меню';
                            const optsOrder = {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [{ text: '💲 Текущий процент с заказа: ' + persent*100 + '%', callback_data: 'change_percent', }],
                                        [{ text: '✍🏻 Текущий сервисный сбор: ' + service_price + 'руб', callback_data: 'change_service', }],
                                        [{ text: '🌸 Цена доставки духи: ' + perfume_priceStepOne + 'руб', callback_data: 'change_perfume' }],
                                        [{ text: '👟 Цена доставки обувь: ' + shoes_priceStepOne + 'руб', callback_data: 'change_shoes' }],
                                        [{ text: '👕 Цена доставки Одежда: ' + clothes_priceStepOne + 'руб', callback_data: 'change_clothes' }],
                                        [{ text: '💼 Цена доставки Сумки: ' + bag_priceStepOne + 'руб', callback_data: 'change_bag' }],
                                        [{ text: '⌚ Цена доставки Часы: ' + clock_priceStepOne + 'руб', callback_data: 'change_clock' }],
                                        [{ text: '◀️ Назад', callback_data: 'before', }],
                                        [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                    ]
                                })
                            };
                            bot.sendMessage(chatId, messageTextOrder, optsOrder);
                            console.log("Соединение с базой данных закрыто");
                        }
                    }
                    connect();
                }
            };

            // Добавляем обработчик событий для сообщений
            bot.on('message', messageHandler);
        } catch (error) {
            console.error('Ошибка в ожидании объёма духов:', error);
        } finally {
            // Сбрасываем флаг ожидания ответа для данного чата
            userContext[chatId].awaitingResponse = false;
        }
    }
    else if (data === 'change_clock') {
        userContext[chatId] = { awaitingResponse: true };
        connect();
        try {
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите новое значение доставки часов: ');

            // Постоянный обработчик событий для сообщений
            const messageHandler = async (msg) => {
                if (msg.chat.id === chatId) {
                    bot.off('message', messageHandler); // Удаляем обработчик после получения правильного сообщения
                    const newService = msg.text;

                    const connect = async () => {
                        try {
                            await MongoDBclient.connect();
                            console.log("Успешно подключились к базе данных");

                            const db = MongoDBclient.db('CapBot_admin'); // Получаем доступ к базе данных


                            const adminCollection = db.collection('admin'); // Получаем доступ к коллекции 'admin'

                            await adminCollection.updateOne({}, {$set: { clock_priceStepOne: newService }});

                            const admin = await adminCollection.findOne(); // Здесь вы можете добавить код для получения значений из коллекции 'admin'


                            const clock_priceStepOne = admin.clock_priceStepOne;

                            bot.sendMessage(chatId, 'Доставка обуви изменилась: ' + clock_priceStepOne);

                        } catch (e) {
                            console.log(e);
                        } finally {
                            await MongoDBclient.close();
                            const messageTextOrder = 'Выберите нужный пункт меню';
                            const optsOrder = {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [{ text: '💲 Текущий процент с заказа: ' + persent*100 + '%', callback_data: 'change_percent', }],
                                        [{ text: '✍🏻 Текущий сервисный сбор: ' + service_price + 'руб', callback_data: 'change_service', }],
                                        [{ text: '🌸 Цена доставки духи: ' + perfume_priceStepOne + 'руб', callback_data: 'change_perfume' }],
                                        [{ text: '👟 Цена доставки обувь: ' + shoes_priceStepOne + 'руб', callback_data: 'change_shoes' }],
                                        [{ text: '👕 Цена доставки Одежда: ' + clothes_priceStepOne + 'руб', callback_data: 'change_clothes' }],
                                        [{ text: '💼 Цена доставки Сумки: ' + bag_priceStepOne + 'руб', callback_data: 'change_bag' }],
                                        [{ text: '⌚ Цена доставки Часы: ' + clock_priceStepOne + 'руб', callback_data: 'change_clock' }],
                                        [{ text: '◀️ Назад', callback_data: 'before', }],
                                        [{ text: '👤 Bot created by @Vovuslexx ' , callback_data: 'author', }],
                                    ]
                                })
                            };
                            bot.sendMessage(chatId, messageTextOrder, optsOrder);
                            console.log("Соединение с базой данных закрыто");
                        }
                    }
                    connect();
                }
            };

            // Добавляем обработчик событий для сообщений
            bot.on('message', messageHandler);
        } catch (error) {
            console.error('Ошибка в ожидании объёма духов:', error);
        } finally {
            // Сбрасываем флаг ожидания ответа для данного чата
            userContext[chatId].awaitingResponse = false;
        }
    }

});

// AUTHOR
bot.on('callback_query', async (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    if (data === 'author') {
        const profileLink = "https://t.me/Vovuslexx"; // Ссылка на профиль
        await bot.sendMessage(chatId, profileLink, {
            disable_web_page_preview: false
        }); // Отправка ссылки на профиль с возможностью предпросмотра
    }
});
