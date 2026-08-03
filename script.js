// smooth scroll for navbar links
document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute("href"));
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
});

// slide-in project panel logic
const panel = document.getElementById("project-panel");
const panelContent = document.getElementById("project-content");
const panelClose = document.getElementById("panel-close");

const projectDetails = {
    rc4: `
        <h2>rc4 fpga accelerator</h2>
        <p>
            a custom 4-core rc4 decryption engine implemented on fpga using verilog
            and pipelined ksa/prga design. the goal was to brute-force a 24-bit
            keyspace with ascii filtering and on-chip memory.
        </p>

        <img src="images/rc4_fpga.png" alt="rc4 fpga" class="project-img" data-lightbox="true" />

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
        <p>


        <pre><code class="language-verilog">
// FSM state register and i counter
always_ff @(posedge clk or posedge reset_n) begin
    if (reset_n) begin
        i <= 8'd0;
        state <= IDLE;
        done <= 1'b0;
    end else begin
        if (state == WRITING)
            i <= i + 1;
        if(state == DONE)
            done <= 1'b1;
        state <= next_state;
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
       (decrypt_data >= 8'd97 && decrypt_data <= 8'd122)) begin
        invalid <= 1'b0;
    end else begin
        invalid <= 1'b1;
    end
end
        </code></pre>

        <p>the third level splits the keyspace into four sections and 
        runs in parallel, and once one core decrypts, the other cores stop. below is the fsm for a core</p>
        <pre><code class="language-verilog">
CHECK_VALID: begin
if (done_task3) begin
    if (invalid) begin
        state <= INCR_KEY; //if invalid, increment key
    end else begin
        state <= FINISHED; //if not, assume we are finished
    end
end
INCR_KEY: begin
    if (secret_key == end_key) begin
        state <= FAILED;
    end else begin
        secret_key <= secret_key + 24'd1;
        state <= INCR_WAIT;
    end
end
INCR_WAIT: state <= RESET_FSM;
FAILED: begin
    LED[8] <= 1'b1; //light led 9 if failed
    LED[9] <= 1'b0;
    state <= FAILED;
end
FINISHED: begin
    LED[9] <= 1'b1; //light led 10 if success
    LED[8] <= 1'b0;
    found <= 1'b1;
    state <= FINISHED;
    found_key <= secret_key;
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

        <img src="images/dds.png" class="project-img" data-lightbox="true" />
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
        lfsr <= 5'b00001;
    else begin
        lfsr[4] <= feedback;
        lfsr[3] <= lfsr[4];
        lfsr[2] <= lfsr[3];
        lfsr[1] <= lfsr[2];
        lfsr[0] <= lfsr[1];
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
        <img src="images/rearecu.png" class="project-img" data-lightbox="true" />
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

// helper: open panel with content
function openPanelWithContent(html) {
    panelContent.innerHTML = html;
    panel.classList.add("open");
    Prism.highlightAll(); // <-- this makes syntax highlighting actually work
}


// helper: close panel (returns promise so we can await animation)
function closePanel() {
    return new Promise(resolve => {
        if (!panel.classList.contains("open")) {
            resolve();
            return;
        }
        panel.classList.remove("open");
        setTimeout(resolve, 350); // match css transition
    });
}

// card click handling
document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", async () => {
        const key = card.dataset.project;
        const html = projectDetails[key];
        if (!html) return;

        if (!panel.classList.contains("open")) {
            openPanelWithContent(html);
            Prism.highlightAll(); // redundant but safe
        } else {
            await closePanel();
            pausePanelVideos();
            openPanelWithContent(html);

        }
    });
});

panelClose.addEventListener("click", () => {
    pausePanelVideos();
    closePanel();
});


// lightbox logic (event delegation so it works for dynamic images too)
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");

// track the set of images in whichever gallery was clicked, so arrows
// can step through just that gallery
let currentGalleryImages = [];
let currentImageIndex = 0;

function showLightboxImage() {
    if (!currentGalleryImages.length) return;
    lightboxImg.src = currentGalleryImages[currentImageIndex].src;
    // hide arrows entirely if there's only one image to look at
    const multiple = currentGalleryImages.length > 1;
    lightboxPrev.style.display = multiple ? "flex" : "none";
    lightboxNext.style.display = multiple ? "flex" : "none";
}

function showNextImage() {
    if (!currentGalleryImages.length) return;
    currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
    showLightboxImage();
}

function showPrevImage() {
    if (!currentGalleryImages.length) return;
    currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    showLightboxImage();
}

// any click on an element with data-lightbox="true"
document.addEventListener("click", e => {
    const target = e.target;

    if (target.matches("img[data-lightbox]")) {
        // gather every lightbox-able image in the same gallery-grid
        const gallery = target.closest(".gallery-grid");
        currentGalleryImages = gallery
            ? Array.from(gallery.querySelectorAll("img[data-lightbox]"))
            : [target];
        currentImageIndex = currentGalleryImages.indexOf(target);
        if (currentImageIndex === -1) currentImageIndex = 0;

        showLightboxImage();
        lightbox.classList.add("open");
    }
});

// arrow button clicks (stop propagation so they don't trigger the
// background-click-to-close handler below)
lightboxPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    showPrevImage();
});

lightboxNext.addEventListener("click", (e) => {
    e.stopPropagation();
    showNextImage();
});

// close lightbox on X
lightboxClose.addEventListener("click", () => {
    lightbox.classList.remove("open");
});

// close lightbox when clicking the background (not the image or arrows)
lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) { 
        lightbox.classList.remove("open");
    }
});

// left/right arrow keys navigate while lightbox is open
document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "ArrowRight") showNextImage();
    if (e.key === "ArrowLeft") showPrevImage();
});

// close panel when pressing Escape
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        pausePanelVideos();
        panel.classList.remove("open");
    }
});

// close lightbox with Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        lightbox.classList.remove("open");
    }
});

// close panel by clicking outside it
document.addEventListener("click", (e) => {
    const clickedInsidePanel = panel.contains(e.target);
    const clickedCard = e.target.closest(".card"); // allow clicking cards to open panel

    if (!clickedInsidePanel && !clickedCard) {
        pausePanelVideos();
        panel.classList.remove("open");
    }
});


function pausePanelVideos() {
    const videos = panel.querySelectorAll("video");
    videos.forEach(v => {
        v.pause();
        v.currentTime = 0;   // optional: reset playback to start
    });
}
document.addEventListener("click", (e) => {
    const wrapper = e.target.closest(".video-wrapper");
    if (!wrapper) return;

    const video = wrapper.querySelector("video");

    if (video.paused) {
        video.play();
        wrapper.classList.add("playing");
    } else {
        video.pause();
        wrapper.classList.remove("playing");
        video.currentTime = 0;
    }
});

const videoLightbox = document.getElementById("video-lightbox");
const videoLightboxVideo = document.getElementById("video-lightbox-video");
const videoLightboxClose = document.getElementById("video-lightbox-close");

// open video lightbox
document.addEventListener("click", e => {
    const thumb = e.target.closest(".adventure-thumb");
    if (!thumb) return;

    const src = thumb.querySelector("source")?.src || thumb.src;

    videoLightboxVideo.src = src;
    videoLightbox.classList.add("open");
    videoLightboxVideo.play();
});

// close video lightbox
function closeVideoLightbox() {
    videoLightbox.classList.remove("open");
    videoLightboxVideo.pause();
    videoLightboxVideo.currentTime = 0;  // reset ONLY when closing lightbox
    videoLightboxVideo.src = "";
}

videoLightboxClose.addEventListener("click", closeVideoLightbox);

videoLightbox.addEventListener("click", e => {
    if (e.target === videoLightbox) closeVideoLightbox();
});

// Escape key closes it
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeVideoLightbox();
});

// collapsible bucket/completed sections
document.querySelectorAll(".collapsible-header").forEach(header => {
    header.addEventListener("click", () => {
        const section = header.parentElement;
        section.classList.toggle("open");
    });
});

// light / dark mode toggle
const themeToggle = document.getElementById("theme-toggle");

function updateToggleIcon() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    themeToggle.textContent = isDark ? "☀️" : "🌙";
}

themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    }
    updateToggleIcon();
});

updateToggleIcon();
projectDetails.trial = `
<h2>The Trial — Franz Kafka</h2>

<img src="images/thetrial.jpg" class="review-img" data-lightbox="true">

<p>
Josef K., a man arrested and prosecuted by an inaccessible authority, 
with the nature of the crime of which he is accused revealed neither to him nor to the reader.
</p>

<p><strong>rating:</strong> TBD</p>

<p>
Review TBD
</p>
`;

projectDetails.alchemist = `
<h2>The Alchemist</h2>

<img src="images/thealchemist.jpg" class="review-img" data-lightbox="true">

<p>
The story follows Santiago, a shepherd boy, in his journey across North Africa 
to the Egyptian pyramids after he dreams of finding treasure there.
</p>

<p><strong>rating:</strong> ★★★⯨☆</p>

<p>
the story and premise is incredibly engaging, and Santiago's growth and development are fascinating, however,
the plot slows down significantly, and results in a narrative that becomes very repetitive midway through the book. 
It also almost felt as if the buildup and conclusion was extremely anti-climactic, and towards the end, it was a story that could 
be summarized as "never back down, never give up".
</p>
`;

projectDetails.hotel = `
<h2>The Grand Budapest Hotel</h2>

<img src="images/thegrandbudapesthotel.jpg" class="review-img" data-lightbox="true">

<p>
The Grand Budapest Hotel is a popular European ski resort, presided over by concierge Gustave H. 
Zero, a junior lobby boy, becomes Gustave's friend and protégé. Gustave prides himself on providing first-class 
service to the hotel's guests, and when one of his guests mysteriously dies, he is framed as the prime suspect.<\p>

<p><strong>rating:</strong> ★★★★★</p>

<p>
A visually unique film, with each environment and setting unlike other films, and framing of characters truly 
fascinating. I especially enjoyed the way the story was told, and the acting was almost choppy in a good way. <\p>
<p>
The story had me feeling a range of emotions with a surprisingly bleak ending (in an inexplicably positive way). It 
almost felt like a play on tv.
</p>


`;