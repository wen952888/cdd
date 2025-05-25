// frontend/js/main.js (简化测试版 - dealButton 监听器修改)

    // ... (其他代码不变，直到 dealButton 监听器) ...

    if (domElements.dealButton) {
        domElements.dealButton.addEventListener('click', () => {
            console.log("Simplified: --- 发牌按钮点击 (超简化渲染测试) ---");

            if (!domElements.initialAndMiddleHandElement) {
                console.error("Simplified Deal (超简化): initialAndMiddleHandElement is missing!");
                safeDisplayMessage("错误: 无法操作牌区，核心组件缺失。", true);
                return;
            }
            
            // 1. 记录发牌前的HTML (可选，用于对比)
            // const bodyOuterHTMLBefore = document.body.outerHTML;
            // console.log("Body HTML before simple modification:", bodyOuterHTMLBefore);

            // 2. 只清空目标区域
            domElements.initialAndMiddleHandElement.innerHTML = ''; 
            console.log("Simplified Deal (超简化): initialAndMiddleHandElement cleared.");

            // 3. 只添加一个简单的文本节点到目标区域
            const testTextNode = document.createTextNode("测试文本已添加到中央牌区");
            domElements.initialAndMiddleHandElement.appendChild(testTextNode);
            console.log("Simplified Deal (超简化): Test text node appended.");

            // 4. 记录发牌后的HTML (可选，用于对比)
            // const bodyOuterHTMLAfter = document.body.outerHTML;
            // console.log("Body HTML after simple modification:", bodyOuterHTMLAfter);
            // if (bodyOuterHTMLBefore === bodyOuterHTMLAfter && domElements.initialAndMiddleHandElement.textContent === "测试文本已添加到中央牌区") {
            //    console.log("HTML structure seems unchanged except for target area.");
            // } else {
            //    console.warn("HTML structure MIGHT have changed beyond the target area!");
            // }


            safeDisplayMessage("请理牌 (超简化测试)。", false);
            if (domElements.confirmOrganizationButton) { domElements.confirmOrganizationButton.style.display = 'inline-block'; domElements.confirmOrganizationButton.disabled = false; }
            if (domElements.dealButton) domElements.dealButton.disabled = true;
        });
    } else {
        console.error("Simplified: dealButton is null, listener not added.");
    }

    // ... (其他代码不变) ...
