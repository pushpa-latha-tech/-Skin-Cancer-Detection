// SkinGuard AI - Main Application Logic
// SkinGuard AI - Integrated with Flask Backend
class SkinLesionAnalyzer {
    constructor() {
        this.imageSize = 150; // must match backend preprocessing size

        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.imageInfo = document.getElementById('imageInfo');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultCard = document.getElementById('resultCard');
        this.resultLabel = document.getElementById('resultLabel');
        this.resultConfidence = document.getElementById('resultConfidence');
        this.newAnalysisBtn = document.getElementById('newAnalysisBtn');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.navMenu = document.getElementById('navMenu');
    }

    initializeEventListeners() {
        this.imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        this.uploadArea.addEventListener('click', () => this.imageInput.click());

        this.analyzeBtn.addEventListener('click', () => this.analyzeImage());
        this.newAnalysisBtn.addEventListener('click', () => this.resetAnalysis());

        if (this.mobileMenuToggle && this.navMenu) {
            this.mobileMenuToggle.addEventListener('click', () => {
                this.navMenu.classList.toggle('active');
                const icon = this.mobileMenuToggle.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (this.navMenu.classList.contains('active')) {
                    this.navMenu.classList.remove('active');
                    const icon = this.mobileMenuToggle.querySelector('i');
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            });
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            this.showError('Please upload only JPG or PNG images.');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('File size too large. Please upload an image smaller than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.displayImagePreview(e.target.result, file);
        };
        reader.readAsDataURL(file);
    }

    displayImagePreview(imageSrc, file) {
        this.previewImg.src = imageSrc;
        this.imagePreview.style.display = 'block';

        const fileSizeKB = (file.size / 1024).toFixed(1);
        this.imageInfo.textContent = `${file.name} (${fileSizeKB} KB)`;

        this.analyzeBtn.disabled = false;
        this.resultsSection.style.display = 'none';
    }

    async analyzeImage() {
        try {
            this.loadingIndicator.style.display = 'block';
            this.analyzeBtn.disabled = true;

            const file = this.imageInput.files[0];
            if (!file) {
                this.showError("Please upload an image first.");
                return;
            }

            let formData = new FormData();
            formData.append("file", file);

            // 🔹 Call Flask backend
            let res = await fetch("http://127.0.0.1:5000/predict", {
                method: "POST",
                body: formData
            });

            let data = await res.json();
            if (data.error) {
                this.showError(data.error);
            } else {
                this.displayResults({
                    class: data.prediction,
                    confidence: data.confidence / 100,
                    isMalignant: data.prediction === "Malignant"
                });
            }

        } catch (error) {
            console.error("Error during analysis:", error);
            this.showError("Failed to analyze image. Please try again.");
        } finally {
            this.loadingIndicator.style.display = 'none';
            this.analyzeBtn.disabled = false;
        }
    }

    displayResults(prediction) {
        const { class: resultClass, confidence, isMalignant } = prediction;

        this.resultLabel.textContent = resultClass;
        this.resultLabel.className = `result-label ${isMalignant ? 'result-malignant' : 'result-benign'}`;

        const confidencePercent = (confidence * 100).toFixed(1);
        this.resultConfidence.textContent = `Confidence: ${confidencePercent}%`;

        if (isMalignant) {
            this.resultCard.style.borderLeft = '5px solid var(--red-danger)';
        } else {
            this.resultCard.style.borderLeft = '5px solid var(--green-success)';
        }

        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    resetAnalysis() {
        this.imageInput.value = '';
        this.imagePreview.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.loadingIndicator.style.display = 'none';
        this.analyzeBtn.disabled = true;
        this.resultCard.style.borderLeft = 'none';

        this.uploadArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--red-danger);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SkinLesionAnalyzer();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const navMenu = document.getElementById('navMenu');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            const toggle = document.getElementById('mobileMenuToggle');
            if (toggle) {
                const icon = toggle.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
    }
});
