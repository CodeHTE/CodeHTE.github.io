(function() {
    'use strict';

    const scenes = {
        calendar: document.getElementById('calendarScene'),
        mothersDay: document.getElementById('mothersDayScene'),
        birthday: document.getElementById('birthdayScene'),
        valentine: document.getElementById('valentineScene'),
        end: document.getElementById('endScene')
    };

    const calendarGrid = document.getElementById('calendarGrid');
    const calendarWrapper = document.getElementById('calendarWrapper');
    const draggableArrow = document.getElementById('draggableArrow');
    const calendarHint = document.getElementById('calendarHint');
    const progressDots = document.getElementById('progressDots');
    const flowersWrapper = document.getElementById('flowersWrapper');
    const bannerText = document.getElementById('bannerText');
    const acceptFlowersBtn = document.getElementById('acceptFlowersBtn');
    const blowHint = document.getElementById('blowHint');
    const btnWish = document.getElementById('btnWish');
    const btnWishDone = document.getElementById('btnWishDone');
    const wishOverlay = document.getElementById('wishOverlay');
    const btnWishOverlayDone = document.getElementById('btnWishOverlayDone');
    const blowDraggable = document.getElementById('blowDraggable');
    const cakeContainer = document.getElementById('cakeContainer');
    const wishResultOverlay = document.getElementById('wishResultOverlay');
    const wishResultBox = document.getElementById('wishResultBox');
    const btnWishResultClose = document.getElementById('btnWishResultClose');
    const moneyTree = document.getElementById('moneyTree');
    const shakeCounter = document.getElementById('shakeCounter');
    const shakeCountEl = document.getElementById('shakeCount');
    const btnCatchWealth = document.getElementById('btnCatchWealth');
    const wealthMessage = document.getElementById('wealthMessage');
    const valentineSubtitle = document.getElementById('valentineSubtitle');
    const fallingWealth = document.getElementById('fallingWealth');
    const hangingCardsContainer = document.getElementById('hangingCards');

    const TARGET_DATES = [
        { day: 10, label: '母亲节', scene: 'mothersDay', hint: '拖拽箭头到 <strong>5月10日</strong>（母亲节）' },
        { day: 18, label: '生日', scene: 'birthday', hint: '拖拽箭头到 <strong>5月18日</strong>（生日）' },
        { day: 20, label: '520节日', scene: 'valentine', hint: '拖拽箭头到 <strong>5月20日</strong>（520节日）' }
    ];

    const TOTAL_STEPS = TARGET_DATES.length;

    let currentProgress = 0;
    let completedDates = [false, false, false];

    let isDragging = false;
    let arrowOffsetX = 0;
    let arrowOffsetY = 0;

    let allCandlesBlown = false;

    let shakeCount = 0;
    let cardsRevealed = [false, false, false];
    let totalCardsRevealed = 0;
    let wealthFalling = false;

    let blowDragging = false;
    let blowStartX = 0;
    let blowStartY = 0;
    let blowGrabX = 0;
    let blowGrabY = 0;

    let activeFlipCard = null;

    const giftCards = [
        {
            img: '1.jpg',
            emoji: '🌸',
            title: '康乃馨香薰礼盒',
            desc: '淡雅康乃馨香氛\n让妈妈的居室温馨宁静'
        },
        {
            img: '2.jpg',
            emoji: '🌺',
            title: '桌面栀子花盆栽',
            desc: '鲜活栀子花盆栽\n为妈妈的办公桌添一抹清香'
        },
        {
            img: '3.jpg',
            emoji: '🖼️',
            title: '创意“世上只有妈妈好”相框',
            desc: '定制创意相框\n珍藏与妈妈的美好瞬间'
        },
        {
            img: '4.jpg',
            emoji: '💐',
            title: '20朵康乃馨',
            desc: '满满一束康乃馨\n像妈妈的爱一样热烈'
        }
    ];

    function switchScene(scene) {
        Object.values(scenes).forEach((s) => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
        scene.classList.remove('hidden');
        scene.classList.add('active');
        scene.scrollTop = 0;
    }

    function buildCalendar() {
        calendarGrid.innerHTML = '';
        const firstDay = 5;
        const days = 31;
        const rows = Math.ceil((firstDay + days) / 7);

        for (let i = 0; i < rows * 7; i += 1) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            const dayNum = i - firstDay + 1;

            if (dayNum < 1 || dayNum > days) {
                cell.classList.add('empty');
            } else {
                cell.textContent = String(dayNum);
                cell.dataset.day = String(dayNum);
                const idx = TARGET_DATES.findIndex((t) => t.day === dayNum);
                if (idx >= 0) {
                    cell.classList.add('special');
                    if (completedDates[idx]) {
                        cell.classList.add('completed');
                        cell.classList.remove('special');
                    }
                }
            }
            calendarGrid.appendChild(cell);
        }

        updateHighlight();
    }

    function updateHighlight() {
        document.querySelectorAll('.highlight-target').forEach((c) => { c.classList.remove('highlight-target'); });
        if (currentProgress < TOTAL_STEPS) {
            const target = document.querySelector(`.calendar-cell[data-day="${TARGET_DATES[currentProgress].day}"]`);
            if (target && !completedDates[currentProgress]) {
                target.classList.add('highlight-target');
            }
        }
    }

    function updateHint() {
        if (currentProgress < TOTAL_STEPS) {
            calendarHint.innerHTML = `👇 ${TARGET_DATES[currentProgress].hint}`;
        } else {
            calendarHint.innerHTML = '🎉 全部完成！';
        }
        updateProgressDots();
    }

    function updateProgressDots() {
        const dots = progressDots.querySelectorAll('.progress-dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('done', 'current');
            if (completedDates[i]) {
                dot.classList.add('done');
            } else if (i === currentProgress && currentProgress < TOTAL_STEPS) {
                dot.classList.add('current');
            }
        });
    }

    function resetArrow() {
        const rect = calendarWrapper.getBoundingClientRect();
        draggableArrow.style.left = `${rect.width / 2 - 25}px`;
        draggableArrow.style.top = '-10px';
        draggableArrow.classList.remove('dragging');
        isDragging = false;
    }

    function arrowCenter() {
        const r = draggableArrow.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function findNearestCell(x, y) {
        let best = null;
        let min = Infinity;
        document.querySelectorAll('.calendar-cell:not(.empty)').forEach((c) => {
            const r = c.getBoundingClientRect();
            const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
            if (d < min) {
                min = d;
                best = c;
            }
        });
        return min < 45 ? best : null;
    }

    function handleDrop() {
        if (currentProgress >= TOTAL_STEPS) {
            return;
        }

        const { x, y } = arrowCenter();
        const cell = findNearestCell(x, y);
        if (!cell) {
            resetArrow();
            return;
        }

        const day = Number.parseInt(cell.dataset.day || '', 10);
        const idx = TARGET_DATES.findIndex((t) => t.day === day);

        if (idx !== currentProgress) {
            alert(idx >= 0 && completedDates[idx] ? '这个日期已经庆祝过了~' : `请选择 ${TARGET_DATES[currentProgress].label}`);
            resetArrow();
            return;
        }

        completedDates[currentProgress] = true;
        buildCalendar();
        updateHint();
        resetArrow();

        if (TARGET_DATES[currentProgress].scene === 'mothersDay') {
            launchMothersDay();
        } else if (TARGET_DATES[currentProgress].scene === 'birthday') {
            launchBirthday();
        } else {
            launchValentine();
        }
    }

    draggableArrow.addEventListener('mousedown', (e) => {
        if (currentProgress >= TOTAL_STEPS) {
            return;
        }
        e.preventDefault();
        isDragging = true;
        draggableArrow.classList.add('dragging');
        const r = draggableArrow.getBoundingClientRect();
        arrowOffsetX = e.clientX - r.left;
        arrowOffsetY = e.clientY - r.top;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) {
            return;
        }
        e.preventDefault();
        const wr = calendarWrapper.getBoundingClientRect();
        draggableArrow.style.left = `${e.clientX - wr.left - arrowOffsetX}px`;
        draggableArrow.style.top = `${e.clientY - wr.top - arrowOffsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) {
            return;
        }
        isDragging = false;
        draggableArrow.classList.remove('dragging');
        handleDrop();
    });

    draggableArrow.addEventListener('touchstart', (e) => {
        if (currentProgress >= TOTAL_STEPS) {
            return;
        }
        e.preventDefault();
        isDragging = true;
        draggableArrow.classList.add('dragging');
        const r = draggableArrow.getBoundingClientRect();
        arrowOffsetX = e.touches[0].clientX - r.left;
        arrowOffsetY = e.touches[0].clientY - r.top;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) {
            return;
        }
        e.preventDefault();
        const wr = calendarWrapper.getBoundingClientRect();
        draggableArrow.style.left = `${e.touches[0].clientX - wr.left - arrowOffsetX}px`;
        draggableArrow.style.top = `${e.touches[0].clientY - wr.top - arrowOffsetY}px`;
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (!isDragging) {
            return;
        }
        isDragging = false;
        draggableArrow.classList.remove('dragging');
        handleDrop();
    });

    function returnToCalendar(advanceProgress) {
        if (advanceProgress && currentProgress < TOTAL_STEPS && completedDates[currentProgress]) {
            currentProgress += 1;
            if (currentProgress > TOTAL_STEPS) {
                currentProgress = TOTAL_STEPS;
            }
        }

        buildCalendar();
        updateHint();
        resetArrow();
        switchScene(scenes.calendar);

        if (currentProgress >= TOTAL_STEPS) {
            setTimeout(() => switchScene(scenes.end), 1500);
        }
    }

    function launchMothersDay() {
        switchScene(scenes.mothersDay);
        flowersWrapper.querySelectorAll('.carnation-particle').forEach((el) => { el.remove(); });

        const mothersdayTitle = document.getElementById('mothersdayTitle');
        mothersdayTitle.classList.remove('reveal');
        mothersdayTitle.style.opacity = '0';
        mothersdayTitle.querySelectorAll('.mothersday-title-particle').forEach((el) => { el.remove(); });

        setTimeout(() => {
            mothersdayTitle.classList.add('reveal');
            createMothersdayParticles(mothersdayTitle);
        }, 300);

        const bouquet = document.getElementById('giantBouquet');
        bouquet.style.animation = 'none';
        void bouquet.offsetHeight;
        bouquet.style.animation = 'bouquetAppear 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 2.2s forwards';
        bouquet.style.transform = 'translate(-50%, -50%) scale(0)';

        bannerText.style.opacity = '0';
        bannerText.style.animation = 'none';
        void bannerText.offsetHeight;
        bannerText.style.animation = 'bannerReveal 1.2s ease-out 3s forwards';

        acceptFlowersBtn.style.display = 'none';
        acceptFlowersBtn.style.opacity = '0';
        acceptFlowersBtn.style.animation = 'none';

        const particles = ['✨', '🌟', '💫', '⭐', '✨', '🌟', '💫', '🌸', '💮', '🌷'];
        particles.forEach((emoji, i) => {
            const el = document.createElement('span');
            el.className = 'carnation-particle';
            el.textContent = emoji;
            el.style.left = `${Math.random() * 85}%`;
            el.style.bottom = '-20px';
            el.style.fontSize = `${1.8 + Math.random() * 2.5}rem`;
            el.style.animationDelay = `${i * 0.22}s`;
            el.style.animationDuration = `${3 + Math.random() * 2}s`;
            flowersWrapper.appendChild(el);
        });

        setTimeout(() => {
            acceptFlowersBtn.style.display = 'inline-block';
            void acceptFlowersBtn.offsetHeight;
            acceptFlowersBtn.style.animation = 'fadeInUp 0.6s ease forwards';
        }, 3800);
    }

    acceptFlowersBtn.addEventListener('click', () => returnToCalendar(true));
    document.getElementById('backFromMothersDay').addEventListener('click', () => returnToCalendar(false));

    function createMothersdayParticles(titleEl) {
        const emojis = ['🌸', '🌺', '✨', '🌟', '💫', '🌷', '💮', '❤️', '💖', '💕', '🎉', '🎊'];
        for (let i = 0; i < 20; i += 1) {
            const p = document.createElement('span');
            p.className = 'mothersday-title-particle';
            p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            p.style.setProperty('--tx', `${Math.random() * 280 - 140}px`);
            p.style.setProperty('--ty', `${Math.random() * 280 - 140}px`);
            p.style.animationDelay = `${0.2 + Math.random() * 0.8}s`;
            p.style.fontSize = `${1.2 + Math.random() * 1.8}rem`;
            titleEl.appendChild(p);
            setTimeout(() => { p.remove(); }, 2500);
        }
    }

    const shakeBarFill = document.getElementById('shakeBarFill');
    const treeSparkle = document.getElementById('treeSparkle');
    const SHAKES_NEEDED = 10;

    function launchBirthday() {
        switchScene(scenes.birthday);
        allCandlesBlown = false;
        blowHint.style.display = 'none';
        blowDraggable.style.display = 'none';
        btnWish.style.display = 'inline-block';
        btnWishDone.style.display = 'none';
        wishOverlay.classList.remove('active');
        document.querySelectorAll('.digit-flame').forEach((f) => {
            f.dataset.blown = 'false';
            f.classList.remove('blown');
        });
        resetBlowPos();
    }

    function resetBlowPos() {
        blowDraggable.style.left = '50%';
        blowDraggable.style.top = 'auto';
        blowDraggable.style.bottom = '15px';
        blowDraggable.style.transform = 'translateX(-50%)';
        blowDraggable.style.animation = 'floatBlow 2s ease-in-out infinite';
    }

    function checkBlow() {
        if (allCandlesBlown) {
            return;
        }

        const br = blowDraggable.getBoundingClientRect();
        const bcx = br.left + br.width / 2;
        const bcy = br.top + br.height / 2;

        document.querySelectorAll('.digit-flame').forEach((f) => {
            if (f.dataset.blown === 'true') {
                return;
            }
            const fr = f.getBoundingClientRect();
            const d = Math.hypot(fr.left + fr.width / 2 - bcx, fr.top + fr.height / 2 - bcy);
            if (d < 50) {
                f.dataset.blown = 'true';
                f.classList.add('blown');
                checkAllBlown();
            }
        });
    }

    function checkAllBlown() {
        const allBlown = [...document.querySelectorAll('.digit-flame')].every((f) => f.dataset.blown === 'true');
        if (allBlown) {
            allCandlesBlown = true;
            blowHint.style.display = 'none';
            blowDraggable.style.display = 'none';
            showWishResult();
        }
    }

    function showWishResult() {
        wishResultOverlay.classList.add('active');
        createWishParticles();
    }

    function createWishParticles() {
        const emojis = ['✨', '🌟', '💫', '⭐', '✨', '🌟', '💫', '💖', '🎉', '🎊'];
        for (let i = 0; i < 15; i += 1) {
            const p = document.createElement('span');
            p.className = 'wish-result-particle';
            p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            p.style.left = '50%';
            p.style.top = '50%';
            p.style.setProperty('--tx', `${Math.random() * 300 - 150}px`);
            p.style.setProperty('--ty', `${Math.random() * 300 - 150}px`);
            p.style.animationDelay = `${Math.random() * 0.5}s`;
            wishResultBox.appendChild(p);
            setTimeout(() => p.remove(), 2000);
        }
    }

    btnWishResultClose.addEventListener('click', () => {
        wishResultOverlay.classList.remove('active');
        returnToCalendar(true);
    });

    blowDraggable.addEventListener('mousedown', (e) => {
        e.preventDefault();
        blowDragging = true;
        blowDraggable.style.animation = 'none';
        const r = blowDraggable.getBoundingClientRect();
        const sr = cakeContainer.getBoundingClientRect();
        blowStartX = r.left - sr.left;
        blowStartY = r.top - sr.top;
        blowGrabX = e.clientX;
        blowGrabY = e.clientY;
        blowDraggable.style.left = `${blowStartX}px`;
        blowDraggable.style.top = `${blowStartY}px`;
        blowDraggable.style.bottom = 'auto';
        blowDraggable.style.transform = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!blowDragging) {
            return;
        }
        e.preventDefault();
        const dx = e.clientX - blowGrabX;
        const dy = e.clientY - blowGrabY;
        blowDraggable.style.left = `${blowStartX + dx}px`;
        blowDraggable.style.top = `${blowStartY + dy}px`;
        checkBlow();
    });

    document.addEventListener('mouseup', () => {
        if (!blowDragging) {
            return;
        }
        blowDragging = false;
        resetBlowPos();
    });

    blowDraggable.addEventListener('touchstart', (e) => {
        e.preventDefault();
        blowDragging = true;
        blowDraggable.style.animation = 'none';
        const r = blowDraggable.getBoundingClientRect();
        const sr = cakeContainer.getBoundingClientRect();
        blowStartX = r.left - sr.left;
        blowStartY = r.top - sr.top;
        blowGrabX = e.touches[0].clientX;
        blowGrabY = e.touches[0].clientY;
        blowDraggable.style.left = `${blowStartX}px`;
        blowDraggable.style.top = `${blowStartY}px`;
        blowDraggable.style.bottom = 'auto';
        blowDraggable.style.transform = 'none';
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!blowDragging) {
            return;
        }
        e.preventDefault();
        const dx = e.touches[0].clientX - blowGrabX;
        const dy = e.touches[0].clientY - blowGrabY;
        blowDraggable.style.left = `${blowStartX + dx}px`;
        blowDraggable.style.top = `${blowStartY + dy}px`;
        checkBlow();
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (!blowDragging) {
            return;
        }
        blowDragging = false;
        resetBlowPos();
    });

    btnWish.addEventListener('click', () => {
        wishOverlay.classList.add('active');
        wishOverlay.querySelectorAll('.shooting-star').forEach((s) => { s.remove(); });
        for (let i = 0; i < 6; i += 1) {
            const star = document.createElement('div');
            star.className = 'shooting-star';
            star.style.top = `${10 + Math.random() * 50}%`;
            star.style.left = `${60 + Math.random() * 35}%`;
            star.style.animationDelay = `${i * 0.5}s`;
            wishOverlay.appendChild(star);
        }
        btnWish.style.display = 'none';
        btnWishDone.style.display = 'inline-block';
    });

    function finishWishAndStartBlow() {
        wishOverlay.classList.remove('active');
        btnWishDone.style.display = 'none';
        blowHint.style.display = 'block';
        blowDraggable.style.display = 'block';
    }

    btnWishDone.addEventListener('click', finishWishAndStartBlow);
    btnWishOverlayDone.addEventListener('click', finishWishAndStartBlow);

    document.getElementById('backFromBirthday').addEventListener('click', () => {
        wishOverlay.classList.remove('active');
        returnToCalendar(false);
    });

    function launchValentine() {
        switchScene(scenes.valentine);
        shakeCount = 0;
        cardsRevealed = [false, false, false, false];
        totalCardsRevealed = 0;
        wealthFalling = false;
        shakeCounter.style.display = 'none';
        shakeCountEl.textContent = '0';
        if (shakeBarFill) shakeBarFill.style.width = '0%';
        btnCatchWealth.style.display = 'none';
        wealthMessage.style.display = 'none';
        valentineSubtitle.textContent = '点击卡片翻开礼物吧！';
        fallingWealth.innerHTML = '';
        document.querySelectorAll('.card-hanger').forEach((h) => { h.classList.remove('removed'); });
        if (activeFlipCard) {
            activeFlipCard.remove();
            activeFlipCard = null;
        }
        setupCards();
    }

    function setupCards() {
        hangingCardsContainer.querySelectorAll('.card-hanger').forEach((h) => {
            const clone = h.cloneNode(true);
            h.parentNode.replaceChild(clone, h);
            const idx = Number.parseInt(clone.dataset.card || '', 10);
            clone.addEventListener('click', (e) => {
                e.stopPropagation();
                if (cardsRevealed[idx]) {
                    return;
                }
                cardsRevealed[idx] = true;
                totalCardsRevealed += 1;
                clone.classList.add('removed');
                const rect = clone.querySelector('.card-mini').getBoundingClientRect();
                flipCardFromRect(rect, idx);
            });
        });
    }

    function flipCardFromRect(startRect, cardIdx) {
        if (activeFlipCard) {
            activeFlipCard.remove();
        }

        const gift = giftCards[cardIdx];
        const container = document.createElement('div');
        container.className = 'flip-card-container';
        container.style.left = `${startRect.left}px`;
        container.style.top = `${startRect.top}px`;
        container.style.width = `${startRect.width}px`;
        container.style.height = `${startRect.height}px`;
        container.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">🎁</div>
                <div class="flip-card-back">
                    <img src="${gift.img}" alt="${gift.title}">
                    <div style="font-size:3rem;display:none;">${gift.emoji}</div>
                    <div class="card-title">${gift.title}</div>
                    <div class="card-desc">${gift.desc}</div>
                    <button type="button" class="btn-primary close-flip-card">收下礼物 ❤️</button>
                </div>
            </div>
        `;

        const image = container.querySelector('img');
        image.addEventListener('error', () => {
            image.style.display = 'none';
            if (image.nextElementSibling) {
                image.nextElementSibling.style.display = 'block';
            }
        });

        document.body.appendChild(container);
        activeFlipCard = container;

        requestAnimationFrame(() => {
            container.style.left = '50%';
            container.style.top = '50%';
            container.style.transform = 'translate(-50%, -50%)';
            container.style.width = '280px';
            container.style.height = '380px';
        });

        container.addEventListener('transitionend', function handler(e) {
            if (e.propertyName === 'width') {
                container.classList.add('flipped');
                container.removeEventListener('transitionend', handler);
            }
        });

        setTimeout(() => {
            const closeBtn = container.querySelector('.close-flip-card');
            closeBtn.addEventListener('click', () => {
                container.remove();
                activeFlipCard = null;
                if (totalCardsRevealed >= 4 && shakeCount === 0) {
                    valentineSubtitle.textContent = '全部礼物已翻开！摇一摇摇钱树吧~';
                    shakeCounter.style.display = 'block';
                    setupTreeShake();
                }
            });
        }, 1000);
    }

    function setupTreeShake() {
        moneyTree.onclick = () => {
            if (wealthFalling || totalCardsRevealed < 3) {
                return;
            }
            shakeCount += 1;
            shakeCountEl.textContent = String(shakeCount);
            shakeBarFill.style.width = `${(shakeCount / SHAKES_NEEDED) * 100}%`;
            moneyTree.classList.remove('shaking');
            void moneyTree.offsetWidth;
            moneyTree.classList.add('shaking');
            emitTreeSparkle();
            if (shakeCount >= SHAKES_NEEDED) {
                triggerWealth();
            }
        };
    }

    function emitTreeSparkle() {
        const sparkleEmojis = ['✨', '🌟', '💫', '⭐', '🪙', '💰'];
        const rect = moneyTree.getBoundingClientRect();
        for (let i = 0; i < 5; i += 1) {
            const p = document.createElement('span');
            p.className = 'tree-sparkle-particle';
            p.textContent = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
            p.style.setProperty('--sx', `${Math.random() * 60 - 30}px`);
            p.style.left = `${rect.width / 2 + Math.random() * 80 - 40}px`;
            p.style.top = `${rect.height / 2 + Math.random() * 80 - 40}px`;
            p.style.animationDelay = `${Math.random() * 0.3}s`;
            treeSparkle.appendChild(p);
            setTimeout(() => { p.remove(); }, 1600);
        }
    }

    function triggerWealth() {
        if (wealthFalling) {
            return;
        }
        wealthFalling = true;
        shakeCounter.style.display = 'none';
        wealthMessage.style.display = 'block';
        fallingWealth.innerHTML = '';

        const waves = [
            { items: ['💵', '💰', '🪙', '💎', '✨', '💵', '💰', '🪙', '💎', '✨', '💵', '💰'], fontSize: '2rem', duration: 8 },
            { items: ['💰', '💎', '✨', '💵', '🪙', '💰', '💎', '✨', '💵', '🪙', '💰', '💎'], fontSize: '2.5rem', duration: 9 },
            { items: ['✨', '💖', '💰', '💎', '🪙', '✨', '💵', '💰', '💎', '✨', '💖', '💰'], fontSize: '1.5rem', duration: 10 },
            { items: ['💎', '✨', '💰', '💵', '🪙', '💎', '✨', '💰', '💵', '🪙', '💎', '✨'], fontSize: '3rem', duration: 11 }
        ];

        waves.forEach((wave, waveIndex) => {
            const startDelay = waveIndex * 2.5;
            wave.items.forEach((emoji, i) => {
                const el = document.createElement('span');
                el.className = 'wealth-item';
                const waveClass = `wave-${(waveIndex % 4) + 1}`;
                el.classList.add(waveClass);
                el.textContent = emoji;
                el.style.setProperty('--fall-duration', `${wave.duration}s`);
                el.style.setProperty('--fall-delay', `${startDelay + i * 0.12}s`);
                el.style.left = `${Math.random() * 100}%`;
                fallingWealth.appendChild(el);
            });
        });

        setTimeout(() => {
            btnCatchWealth.style.display = 'inline-block';
        }, 600);
    }

    btnCatchWealth.addEventListener('click', () => {
        fallingWealth.innerHTML = '';
        switchScene(scenes.end);
        currentProgress = TOTAL_STEPS;
        buildCalendar();
        updateHint();
    });

    document.getElementById('backFromValentine').addEventListener('click', () => {
        fallingWealth.innerHTML = '';
        if (shakeBarFill) shakeBarFill.style.width = '0%';
        if (activeFlipCard) {
            activeFlipCard.remove();
            activeFlipCard = null;
        }
        returnToCalendar(false);
    });

    document.getElementById('btnRestart').addEventListener('click', () => {
        currentProgress = 0;
        completedDates = [false, false, false];
        allCandlesBlown = false;
        shakeCount = 0;
        cardsRevealed = [false, false, false, false];
        totalCardsRevealed = 0;
        wealthFalling = false;
        fallingWealth.innerHTML = '';
        wishOverlay.classList.remove('active');
        wishResultOverlay.classList.remove('active');
        document.querySelectorAll('.card-hanger').forEach((h) => { h.classList.remove('removed'); });
        if (activeFlipCard) {
            activeFlipCard.remove();
            activeFlipCard = null;
        }
        if (shakeBarFill) shakeBarFill.style.width = '0%';
        if (treeSparkle) treeSparkle.innerHTML = '';
        buildCalendar();
        updateHint();
        resetArrow();
        switchScene(scenes.calendar);
        btnCatchWealth.style.display = 'none';
        wealthMessage.style.display = 'none';
        shakeCounter.style.display = 'none';
        blowHint.style.display = 'none';
        blowDraggable.style.display = 'none';
        btnWish.style.display = 'inline-block';
        btnWishDone.style.display = 'none';
        bannerText.style.opacity = '0';
        acceptFlowersBtn.style.display = 'none';
        flowersWrapper.querySelectorAll('.carnation-particle').forEach((el) => { el.remove(); });
        const mothersdayTitle = document.getElementById('mothersdayTitle');
        mothersdayTitle.classList.remove('reveal');
        mothersdayTitle.style.opacity = '0';
        mothersdayTitle.querySelectorAll('.mothersday-title-particle').forEach((el) => { el.remove(); });
    });

    buildCalendar();
    updateHint();
    resetArrow();
    switchScene(scenes.calendar);
    setupCards();
})();
