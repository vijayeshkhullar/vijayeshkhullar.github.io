/* ============================================================
   vijayesh | portfolio: behaviour
   ============================================================ */
(() => {
    "use strict";

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const html = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const store = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ }
        },
    };

    // several things can lock page scroll at once (menu, lightbox); track who
    const scrollLocks = new Set();
    function lockScroll(who, on) {
        on ? scrollLocks.add(who) : scrollLocks.delete(who);
        html.classList.toggle("no-scroll", scrollLocks.size > 0);
    }

    function trapTab(e, container) {
        if (e.key !== "Tab") return;
        const focusable = $$("button, a[href], video[controls], [tabindex]:not([tabindex='-1'])", container)
            .filter(el => !el.hidden && el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    /* ---------- light / dark mode ---------- */

    const themeToggle = $("#theme-toggle");
    const themeMeta = $('meta[name="theme-color"]');

    function applyTheme(theme) {
        html.setAttribute("data-theme", theme);
        if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#0a0f26" : "#edf1f8");
    }

    themeToggle.addEventListener("click", () => {
        const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        store.set("theme", next);
    });
    applyTheme(html.getAttribute("data-theme") === "light" ? "light" : "dark");

    /* ---------- navbar: frosted on scroll, progress line, active section, mobile menu ---------- */

    const nav = $("#navbar");
    const navLinks = $$(".nav-links a");
    const menuBtn = $("#menu-toggle");
    let ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            const max = html.scrollHeight - window.innerHeight;
            nav.classList.toggle("scrolled", y > 24);
            nav.style.setProperty("--p", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");
            ticking = false;
        });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if ("IntersectionObserver" in window) {
        const spy = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navLinks.forEach(a => a.removeAttribute("aria-current"));
                const link = navLinks.find(a => a.getAttribute("href") === "#" + entry.target.id);
                if (link) link.setAttribute("aria-current", "true");
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        ["top", ...navLinks.map(a => a.getAttribute("href").slice(1))]
            .map(id => document.getElementById(id))
            .filter(Boolean)
            .forEach(el => spy.observe(el));
    }

    function setMenu(open) {
        nav.classList.toggle("menu-open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        lockScroll("menu", open);
    }
    menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("menu-open")));
    navLinks.forEach(a => a.addEventListener("click", () => setMenu(false)));
    window.matchMedia("(min-width: 901px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

    /* ---------- hero: a long exposure of the night sky ---------- */
    // stars rotate around a celestial pole and leave trails. trails start as
    // points and stretch as the "shutter" opens. move the mouse right or scroll
    // down to lengthen the exposure.

    (function sky() {
        const canvas = $("#sky");
        if (!canvas || !canvas.getContext) return;
        const hero = canvas.closest(".hero");
        const ctx = canvas.getContext("2d");
        const TAU = Math.PI * 2;

        const palette = [
            { c: [186, 208, 255], p: 0.30 },   // hot, blue-white
            { c: [255, 255, 255], p: 0.30 },
            { c: [255, 238, 212], p: 0.18 },
            { c: [255, 205, 150], p: 0.14 },   // cooler, amber
            { c: [255, 160, 130], p: 0.08 },   // red giants
        ];

        let w = 0, h = 0, px = 0, py = 0, maxR = 0;
        let stars = [];
        let exposure = 0, spin = 0, pointer = null;
        let inView = true, rafId = 0, last = 0;
        const born = performance.now();

        function mulberry32(seed) {
            return () => {
                seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
                let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }

        function build() {
            const rand = mulberry32(20260920);
            const count = Math.max(500, Math.min(2400, Math.round((Math.PI * maxR * maxR) / 2300)));
            stars = [];
            for (let i = 0; i < count; i++) {
                const r = maxR * Math.sqrt(rand());
                const a = rand() * TAU;
                const b = Math.pow(rand(), 3.1);                 // many dim stars, few bright
                let pick = rand();
                let col = palette[0].c;
                for (const p of palette) { pick -= p.p; if (pick <= 0) { col = p.c; break; } }
                const alpha = 0.28 + b * 0.72;
                const rgb = col.join(",");
                stars.push({
                    r, a,
                    size: 0.55 + b * 1.5,
                    head: `rgba(${rgb},${alpha.toFixed(3)})`,
                    tail: `rgba(${rgb},${(alpha * 0.4).toFixed(3)})`,
                    halo: b > 0.78 ? `rgba(${rgb},0.10)` : null,
                });
            }
        }

        function resize() {
            const rect = hero.getBoundingClientRect();
            w = Math.round(rect.width);
            h = Math.round(rect.height);
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const narrow = w < 720;
            px = w * (narrow ? 0.66 : 0.72);
            py = h * (narrow ? 0.20 : 0.26);
            maxR = Math.hypot(Math.max(px, w - px), Math.max(py, h - py)) + 20;
            build();
            draw();
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            ctx.lineCap = "round";
            const m = 40;
            const e = exposure;
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                const a1 = s.a - spin;
                const hx = px + s.r * Math.cos(a1);
                const hy = py + s.r * Math.sin(a1);
                const a0 = a1 + e;
                let onScreen = hx > -m && hx < w + m && hy > -m && hy < h + m;
                if (!onScreen && e > 0.02) {
                    const tx = px + s.r * Math.cos(a0);
                    const ty = py + s.r * Math.sin(a0);
                    onScreen = tx > -m && tx < w + m && ty > -m && ty < h + m;
                }
                if (!onScreen) continue;

                if (s.halo) {
                    ctx.fillStyle = s.halo;
                    ctx.beginPath();
                    ctx.arc(hx, hy, s.size * 4, 0, TAU);
                    ctx.fill();
                }
                if (e * s.r > 2.5) {
                    ctx.lineWidth = s.size;
                    ctx.strokeStyle = s.tail;
                    ctx.beginPath();
                    ctx.arc(px, py, s.r, a1 + e * 0.45, a0);
                    ctx.stroke();
                    ctx.strokeStyle = s.head;
                    ctx.beginPath();
                    ctx.arc(px, py, s.r, a1, a1 + e * 0.45);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = s.head;
                    ctx.beginPath();
                    ctx.arc(hx, hy, s.size * 0.62, 0, TAU);
                    ctx.fill();
                }
            }
        }

        function frame(now) {
            rafId = 0;
            const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
            last = now;
            spin += dt * 0.028;
            const intro = Math.min(1, Math.max(0, (now - born - 250) / 2600));
            const introEase = 1 - Math.pow(1 - intro, 3);
            const scrollBoost = Math.min(1, window.scrollY / Math.max(1, h)) * 0.9;
            const pointerBoost = pointer === null ? 0 : pointer * 0.55;
            const target = introEase * (0.30 + pointerBoost) + scrollBoost;
            exposure += (target - exposure) * (1 - Math.exp(-dt * 3.2));
            draw();
            if (inView && !document.hidden) rafId = requestAnimationFrame(frame);
        }

        function start() {
            if (rafId || reduceMotion.matches) return;
            last = performance.now();
            rafId = requestAnimationFrame(frame);
        }

        hero.addEventListener("pointermove", e => {
            if (e.pointerType === "touch") return;
            const rect = hero.getBoundingClientRect();
            pointer = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        });
        hero.addEventListener("pointerleave", () => { pointer = null; });

        if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
        else window.addEventListener("resize", resize);

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(([entry]) => {
                inView = entry.isIntersecting;
                if (inView) start();
            }).observe(hero);
        }
        document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });

        resize();
        if (reduceMotion.matches) { exposure = 0.4; draw(); }
        else start();
        reduceMotion.addEventListener("change", () => {
            if (reduceMotion.matches) { exposure = 0.4; draw(); } else start();
        });
    })();

    /* ---------- galleries: photos keep their own proportions ---------- */

    $$(".gallery .shot").forEach(shot => {
        const media = $("img, video", shot);
        if (!media) return;
        const settle = () => {
            const w = media.naturalWidth || media.videoWidth;
            const h = media.naturalHeight || media.videoHeight;
            if (w && h) shot.style.setProperty("--ratio", (w / h).toFixed(3));
            media.classList.add("is-loaded");
        };
        if (media.tagName === "IMG") {
            if (media.complete && media.naturalWidth) settle();
            else {
                media.addEventListener("load", settle, { once: true });
                media.addEventListener("error", () => media.classList.add("is-loaded"), { once: true });
            }
        } else {
            media.addEventListener("loadedmetadata", settle, { once: true });
            if (media.readyState >= 1) settle();
        }
    });

    $$(".review-cover").forEach(img => {
        const done = () => img.classList.add("is-loaded");
        if (img.complete) done();
        else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
    });

    /* ---------- slide-in project panel ---------- */

    const panel = $("#project-panel");
    const panelContent = $("#project-content");
    const panelClose = $("#panel-close");
    let lastCard = null;

    const projectDetails = {
        rc4: `
        <h2>rc4 fpga accelerator</h2>
        <p>
            a custom 4-core rc4 decryption engine implemented on fpga using verilog
            and pipelined ksa/prga design. the goal was to brute-force a 24-bit
            keyspace with ascii filtering and on-chip memory.
        </p>

        <img src="images/rc4_fpga.png" alt="rc4 fpga" class="project-img" data-lightbox="true" tabindex="0" />

        <pre><code class="language-verilog">
module code_cracker (
    input clk,
    input reset_n,

    input [7:0] q,
    output logic wren,
    output logic [7:0] data,
    output logic [7:0] address,
    output logic [9:0] LED,
    input [23:0] start_key, end_key,
    output logic [7:0] decrypt_addr, decrypt_data, 
    input [7:0] decrypt_q,
    output logic decrypt_write,
    output logic invalid,
    output logic finished,
    input stop_all,
    output logic [23:0] key
);
endmodule
        </code></pre>

        <p>
            architecture notes: on-chip rom for to read message, fsm-based controller,
            and a multi-core top-level that partitions keyspace across cores.
        </p>
        <p>
            this project functions at 3 levels. 
        </p>
        <p>
            the first level, the ram is filled with ascii encoding, then shuffled
            with the given secret key. below is the fsm state reg and i counter used to fill the ram.
        </p>


        <pre><code class="language-verilog">
// FSM state register and i counter
always_ff @(posedge clk or posedge reset_n) begin
    if (reset_n) begin
        i &lt;= 8'd0;
        state &lt;= IDLE;
        done &lt;= 1'b0;
    end else begin
        if (state == WRITING)
            i &lt;= i + 1;
        if(state == DONE)
            done &lt;= 1'b1;
        state &lt;= next_state;
    end
end
        </code></pre>
        <p>
            in the second level, the secret key is read from the rom and is xor'd with 
            the newly shuffled ram. if the output is correct, then we continue decoding the message, 
            otherwise, we break and change our secret key. below shows the check condition.
        </p>
        <pre><code class="language-verilog">
WAIT_XOR_ENCRYPT: begin
    if(decrypt_data == 8'd32 || 
       (decrypt_data &gt;= 8'd97 &amp;&amp; decrypt_data &lt;= 8'd122)) begin
        invalid &lt;= 1'b0;
    end else begin
        invalid &lt;= 1'b1;
    end
end
        </code></pre>

        <p>the third level splits the keyspace into four sections and 
        runs in parallel, and once one core decrypts, the other cores stop. below is the fsm for a core</p>
        <pre><code class="language-verilog">
CHECK_VALID: begin
if (done_task3) begin
    if (invalid) begin
        state &lt;= INCR_KEY; //if invalid, increment key
    end else begin
        state &lt;= FINISHED; //if not, assume we are finished
    end
end
INCR_KEY: begin
    if (secret_key == end_key) begin
        state &lt;= FAILED;
    end else begin
        secret_key &lt;= secret_key + 24'd1;
        state &lt;= INCR_WAIT;
    end
end
INCR_WAIT: state &lt;= RESET_FSM;
FAILED: begin
    LED[8] &lt;= 1'b1; //light led 9 if failed
    LED[9] &lt;= 1'b0;
    state &lt;= FAILED;
end
FINISHED: begin
    LED[9] &lt;= 1'b1; //light led 10 if success
    LED[8] &lt;= 1'b0;
    found &lt;= 1'b1;
    state &lt;= FINISHED;
    found_key &lt;= secret_key;
end
        </code></pre>
    `,

        "hand gesture puppet": `
        <h2>hand gesture puppet</h2>
        <p>opencv-based hand gesture recognition controlling a 3d-printed hand.</p>

        <video class="project-video" controls>
            <source src="videos/handvideo.mp4" type="video/mp4">
        </video>

        <pre><code class="language-python">
acts = model.forward(obs_batch)
clusters = DBSCAN(eps=0.5, min_samples=10).fit(acts)
        </code></pre>
    `,

        dds: `
        <h2>digital signal modulation</h2>
        <p>dds + lfsr integrated and modulated visually on vga.</p>

        <img src="images/dds.png" alt="dds" class="project-img" data-lightbox="true" tabindex="0" />
        <p>
        this is a hybrid nios II + qsys system integrating a direct digital synthesizer (dds) and 5-bit lfsr.
        </p>
        <pre><code class="language-verilog">
module lfsr_5_bit(
    input clk,
    input reset,
    output logic [4:0] lfsr
);

logic feedback;
assign feedback = lfsr[0] ^ lfsr[2];

always @(posedge clk or posedge reset) begin
    if (reset)
        lfsr &lt;= 5'b00001;
    else begin
        lfsr[4] &lt;= feedback;
        lfsr[3] &lt;= lfsr[4];
        lfsr[2] &lt;= lfsr[3];
        lfsr[1] &lt;= lfsr[2];
        lfsr[0] &lt;= lfsr[1];
    end
end
endmodule
        </code></pre>

        <p>
        implemented ask, bpsk, fsk qpsk modulation with vga oscilloscope visualization. and developed nios II 
        interrupt routines for binary fsk control (1 hz vs 5 hz carriers) via tuning word updates.
        </p>
    `,

        ecu: `
        <h2>electronic control unit</h2>
        <p>stm32 canbus-based electronic control unit  controller with diagnostic output.</p>
        <img src="images/rearecu.png" alt="rear ecu" class="project-img" data-lightbox="true" tabindex="0" />
        <!--<pre><code class="language-c">
HAL_CAN_AddTxMessage(&hcan1, &txHeader, msg, &mailbox);
        </code></pre>-->
    `,

        van: `
        <h2>van helsing game</h2>
        <p>pygame platformer with collision detection and multiple levels.</p>

        <video class="project-video" controls>
            <source src="videos/vanhelsing.mp4" type="video/mp4">
        </video>
        <p>uses a csv file to build the game base, with the numbers in the file corresponding to a type of platform, background 
        and where characters and enemies are spawned.
        using oop principles, the enemies and player are based on the same class, implemented seperately (automated the enemy 
        ai to detect the player in range and attack).</p>
    `,
    };

    function pausePanelVideos() {
        $$("video", panel).forEach(v => { v.pause(); v.currentTime = 0; });
    }

    function fillPanel(markup) {
        panelContent.innerHTML = markup;
        // tidy the blank first/last lines the template literals leave inside code blocks
        $$("pre code", panelContent).forEach(code => {
            code.textContent = code.textContent.replace(/^\n+/, "").replace(/\s+$/, "");
        });
        panel.scrollTop = 0;
        const title = $("h2", panelContent);
        if (title) panel.setAttribute("aria-label", title.textContent);
        if (window.Prism) window.Prism.highlightAllUnder(panelContent);
    }

    function openPanel(key, card) {
        const markup = projectDetails[key];
        if (!markup) return;
        const wasOpen = panel.classList.contains("open");
        $$(".card.is-active").forEach(c => c.classList.remove("is-active"));
        if (card) { card.classList.add("is-active"); lastCard = card; }

        if (wasOpen) {
            panelContent.classList.add("is-swapping");
            setTimeout(() => {
                pausePanelVideos();
                fillPanel(markup);
                panelContent.classList.remove("is-swapping");
            }, 190);
        } else {
            fillPanel(markup);
            panel.classList.add("open");
            document.body.classList.add("panel-open");
            panelClose.focus({ preventScroll: true });
        }
    }

    function closePanel(returnFocus) {
        if (!panel.classList.contains("open")) return;
        pausePanelVideos();
        panel.classList.remove("open");
        document.body.classList.remove("panel-open");
        $$(".card.is-active").forEach(c => c.classList.remove("is-active"));
        if (returnFocus && lastCard) {
            const trigger = $(".card-trigger", lastCard);
            if (trigger) trigger.focus({ preventScroll: true });
        }
    }

    $$(".card[data-project]").forEach(card => {
        card.addEventListener("click", () => openPanel(card.dataset.project, card));
    });
    panelClose.addEventListener("click", () => closePanel(true));

    // click anywhere outside the panel (except a card, which swaps the project) to close it
    document.addEventListener("click", e => {
        if (!panel.classList.contains("open")) return;
        if (e.target.closest("#project-panel, .card, #lightbox, #theme-toggle")) return;
        closePanel(false);
    });

    /* ---------- lightbox: photos + video ---------- */

    const lightbox = $("#lightbox");
    const lbImg = $("#lightbox-img");
    const lbVideo = $("#lightbox-video");
    const lbClose = $("#lightbox-close");
    const lbPrev = $("#lightbox-prev");
    const lbNext = $("#lightbox-next");
    let group = [];
    let index = 0;
    let lbOpener = null;

    function showImage(i) {
        if (!group.length) return;
        index = (i + group.length) % group.length;
        const el = group[index];
        lbVideo.pause();
        lbVideo.hidden = true;
        lbImg.hidden = false;
        lbImg.src = el.currentSrc || el.src;
        lbImg.alt = el.alt || "enlarged image";
        const multiple = group.length > 1;
        lbPrev.hidden = !multiple;
        lbNext.hidden = !multiple;
        // warm the neighbours so arrow-key browsing feels instant
        [index + 1, index - 1].forEach(j => {
            const n = group[(j + group.length) % group.length];
            if (n && n !== el) new Image().src = n.currentSrc || n.src;
        });
    }

    function openLightbox() {
        lbOpener = document.activeElement;
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
        lockScroll("lightbox", true);
        lbClose.focus({ preventScroll: true });
    }

    function closeLightbox() {
        if (!lightbox.classList.contains("open")) return;
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        lockScroll("lightbox", false);
        lbVideo.pause();
        setTimeout(() => {
            if (!lightbox.classList.contains("open")) {
                lbVideo.removeAttribute("src");
                lbVideo.load();
                lbImg.removeAttribute("src");
            }
        }, 320);
        if (lbOpener && document.contains(lbOpener)) lbOpener.focus({ preventScroll: true });
    }

    document.addEventListener("click", e => {
        const img = e.target.closest("img[data-lightbox]");
        if (img) {
            const scope = img.closest(".gallery, #project-content");
            group = scope ? $$("img[data-lightbox]", scope) : [img];
            openLightbox();
            showImage(Math.max(0, group.indexOf(img)));
            return;
        }
        const tile = e.target.closest("[data-video]");
        if (tile) {
            group = [];
            lbImg.hidden = true;
            lbPrev.hidden = true;
            lbNext.hidden = true;
            lbVideo.hidden = false;
            lbVideo.src = tile.dataset.video;
            openLightbox();
            lbVideo.play().catch(() => { /* user can press play */ });
        }
    });

    lbPrev.addEventListener("click", () => showImage(index - 1));
    lbNext.addEventListener("click", () => showImage(index + 1));
    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });

    let touchX = null;
    lightbox.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", e => {
        if (touchX === null || group.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) showImage(index + (dx < 0 ? 1 : -1));
        touchX = null;
    }, { passive: true });

    /* ---------- keyboard ---------- */

    document.addEventListener("keydown", e => {
        // things that aren't native buttons still respond to enter / space
        if ((e.key === "Enter" || e.key === " ") && e.target.matches("img[data-lightbox], [data-video], .review-poster")) {
            e.preventDefault();
            e.target.click();
            return;
        }

        if (lightbox.classList.contains("open")) {
            if (e.key === "Escape") closeLightbox();
            else if (e.key === "ArrowRight" && group.length > 1) showImage(index + 1);
            else if (e.key === "ArrowLeft" && group.length > 1) showImage(index - 1);
            else trapTab(e, lightbox);
            return;
        }
        if (e.key === "Escape") {
            if (nav.classList.contains("menu-open")) setMenu(false);
            else closePanel(true);
        }
    });

    /* ---------- adventure list (collapsible) ---------- */

    $$(".collapsible").forEach(box => {
        const btn = $(".collapsible-header", box);
        const body = $(".collapsible-body", box);
        body.inert = true;
        btn.addEventListener("click", () => {
            const open = btn.getAttribute("aria-expanded") !== "true";
            btn.setAttribute("aria-expanded", String(open));
            box.classList.toggle("open", open);
            body.inert = !open;
        });
    });

    /* ---------- reviews: filter + tap to read ---------- */

    const chips = $$(".chip[data-filter]");
    const reviews = $$(".review");

    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            const filter = chip.dataset.filter;
            chips.forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
            reviews.forEach(r => { r.hidden = !(filter === "all" || r.dataset.kind === filter); });
        });
    });

    reviews.forEach(review => {
        const poster = $(".review-poster", review);
        poster.addEventListener("click", () => review.classList.toggle("is-open"));
    });
})();
