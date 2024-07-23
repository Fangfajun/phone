const video = document.getElementById('video');
const captureButton = document.getElementById('capture');
const githubToken = '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';

// 初始化摄像头
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
        };
    })
    .catch(error => {
        console.error('Error accessing the camera:', error);
    });

async function getShaOfFile(owner, repo, path) {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            headers: {
                'Authorization': `token ${githubToken}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data.sha;
        }
        return null;
    } catch (error) {
        console.error('Error retrieving SHA:', error);
        return null;
    }
}

async function captureAndUpload() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(resolve, 'image/jpeg');
    });

    const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    if (typeof base64data === 'string' && base64data.startsWith('data:image/jpeg;base64,')) {
        const content = base64data.split(',')[1];
        const owner = 'Fangfajun';
        const repo = 'test1';
        const path = 'captured-image.jpg'; // 使用固定文件名

        let sha = await getShaOfFile(owner, repo, path);

        const uploadData = {
            message: "Upload image via web app",
            content,
            branch: 'main'
        };

        if (sha) {
            uploadData.sha = sha;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uploadData)
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Image uploaded successfully:', data);
            } else {
                console.error('Error uploading image:', await response.text());
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    }
}

captureButton.addEventListener('click', captureAndUpload);
