// Main script for TalentForge Landing Page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize upload areas
    initializeUploadArea('employee');
    initializeUploadArea('job');
    initializeUploadArea('candidate');
    
    // Initialize sample template links
    document.getElementById('employeeSampleLink').addEventListener('click', function() {
        downloadSampleTemplate('employee');
    });
    
    document.getElementById('jobSampleLink').addEventListener('click', function() {
        downloadSampleTemplate('job');
    });
    
    document.getElementById('candidateSampleLink').addEventListener('click', function() {
        downloadSampleTemplate('candidate');
    });
});

// Initialize upload area functionality
function initializeUploadArea(type) {
    const uploadArea = document.getElementById(`${type}UploadArea`);
    const fileInput = document.getElementById(`${type}FileInput`);
    
    // Click on upload area to trigger file input
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileUpload(type, e.target.files[0]);
        }
    });
    
    // Handle drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('border-primary');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('border-primary');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('border-primary');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(type, e.dataTransfer.files[0]);
        }
    });
}

// Handle file upload process
function handleFileUpload(type, file) {
    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showError(type, 'File size exceeds the 10MB limit.');
        return;
    }
    
    // Check file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExtension)) {
        showError(type, 'Invalid file format. Please upload CSV or Excel files.');
        return;
    }
    
    // Show progress
    const progressContainer = document.getElementById(`${type}UploadProgressContainer`);
    const progressBar = document.getElementById(`${type}UploadProgressBar`);
    const progressPercentage = document.getElementById(`${type}UploadPercentage`);
    
    progressContainer.style.display = 'block';
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(function() {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Process the file
            if (fileExtension === '.csv') {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const csvData = e.target.result;
                    processFileUpload(type, file.name, csvData);
                };
                reader.readAsText(file);
            } else {
                // For Excel files, we'd need a library like SheetJS
                // For this demo, we'll just simulate success
                setTimeout(function() {
                    showSuccess(type);
                    updateUploadHistory(type, file.name, file.size);
                }, 500);
            }
        }
    }, 100);
}

// Process file upload (for CSV files)
function processFileUpload(type, fileName, csvData) {
    try {
        // Use the Airtable client to process and upload the data
        const records = window.airtableClient.processCSVForUpload(csvData, type);
        
        // Send to Airtable
        window.airtableClient.sendData(type + 's', records)
            .then(response => {
                console.log('Upload successful:', response);
                showSuccess(type);
                updateUploadHistory(type, fileName, csvData.length);
            })
            .catch(error => {
                console.error('Upload error:', error);
                showError(type, `Error uploading to Airtable: ${error.message}`);
            });
    } catch (error) {
        console.error('Processing error:', error);
        showError(type, `Error processing file: ${error.message}`);
    }
}

// Show success message
function showSuccess(type) {
    const progressContainer = document.getElementById(`${type}UploadProgressContainer`);
    const successMessage = document.getElementById(`${type}SuccessMessage`);
    const errorMessage = document.getElementById(`${type}ErrorMessage`);
    const uploadHistory = document.getElementById(`${type}UploadHistory`);
    
    progressContainer.style.display = 'none';
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    uploadHistory.style.display = 'block';
    
    // Hide success message after 5 seconds
    setTimeout(function() {
        successMessage.style.display = 'none';
    }, 5000);
}

// Show error message
function showError(type, message) {
    const progressContainer = document.getElementById(`${type}UploadProgressContainer`);
    const successMessage = document.getElementById(`${type}SuccessMessage`);
    const errorMessage = document.getElementById(`${type}ErrorMessage`);
    const errorText = document.getElementById(`${type}ErrorText`);
    
    progressContainer.style.display = 'none';
    successMessage.style.display = 'none';
    errorMessage.style.display = 'block';
    errorText.textContent = message;
    
    // Hide error message after 5 seconds
    setTimeout(function() {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Update upload history
function updateUploadHistory(type, fileName, fileSize) {
    const historyBody = document.getElementById(`${type}HistoryBody`);
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    
    // Format file size
    let formattedSize;
    if (fileSize < 1024) {
        formattedSize = fileSize + ' B';
    } else if (fileSize < 1024 * 1024) {
        formattedSize = Math.round(fileSize / 1024) + ' KB';
    } else {
        formattedSize = Math.round(fileSize / (1024 * 1024) * 10) / 10 + ' MB';
    }
    
    // Create new row
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${fileName}</td>
        <td>${formattedSize}</td>
        <td>${dateStr}</td>
        <td><span class="badge bg-success">Success</span></td>
    `;
    
    // Add to history
    historyBody.prepend(row);
}

// Download sample template
function downloadSampleTemplate(type) {
    // In a real application, this would download an actual template file
    // For this demo, we'll create a simple CSV on the fly
    
    let csvContent;
    
    if (type === 'employee') {
        csvContent = 'Employee ID,First Name,Last Name,Position,Department,Location,Hire Date,Salary,Manager ID\n';
        csvContent += '1001,John,Smith,Engineer,R&D,Prague,2020-05-15,85000,2001\n';
        csvContent += '1002,Emily,Johnson,Designer,Product,Brno,2019-11-03,78000,2002\n';
        csvContent += '1003,Michael,Williams,Technician,Manufacturing,Ostrava,2021-02-28,65000,2003\n';
    } else if (type === 'job') {
        csvContent = 'Job ID,Title,Department,Location,Required Skills,Experience Level,Education,Salary Range,Status\n';
        csvContent += 'J001,Senior Engineer,R&D,Prague,"Python,C++,Machine Learning",5+ years,Masters,90000-120000,Open\n';
        csvContent += 'J002,Production Manager,Manufacturing,Brno,"Lean Manufacturing,Team Leadership",7+ years,Bachelors,85000-110000,Open\n';
        csvContent += 'J003,Quality Specialist,Quality Assurance,Ostrava,"ISO 9001,Statistical Analysis",3+ years,Bachelors,65000-85000,Open\n';
    } else if (type === 'candidate') {
        csvContent = 'Candidate ID,First Name,Last Name,Email,Phone,Position Applied,Location,Experience,Education,Status\n';
        csvContent += 'C001,David,Brown,david.brown@example.com,+420 123 456 789,Senior Engineer,Prague,6 years,Masters,Screening\n';
        csvContent += 'C002,Sarah,Miller,sarah.miller@example.com,+420 987 654 321,Production Manager,Brno,8 years,Bachelors,Interview\n';
        csvContent += 'C003,Robert,Davis,robert.davis@example.com,+420 456 789 123,Quality Specialist,Ostrava,4 years,Bachelors,Applied\n';
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
