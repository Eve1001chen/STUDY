// 設置測試環境
global.Gun = require('gun');

// 模擬瀏覽器環境
global.window = {
    localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
    }
};

// 清理所有模擬
afterEach(() => {
    jest.clearAllMocks();
});