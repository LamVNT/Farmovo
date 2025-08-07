function removeVietnameseTones(str) {
    return str
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export function generateUsername(fullName, existingUsernames) {
    if (!fullName) return '';
    const parts = removeVietnameseTones(fullName.trim()).split(/\s+/);
    if (parts.length === 0) return '';
    
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0]?.toUpperCase() || '').join('');
    
    // Tạo base username: lastName + initials
    let base = lastName + (initials ? initials : '');
    base = base.replace(/[^a-zA-Z0-9]/g, '');
    
    // Kiểm tra xem có username nào bắt đầu bằng base này không
    const existingBaseUsernames = existingUsernames.filter(username => {
        if (!username.startsWith(base)) return false;
        const suffix = username.substring(base.length);
        // Chỉ lấy những username có suffix là số nguyên dương
        return /^\d+$/.test(suffix) && suffix.length > 0;
    });
    
    // Tìm số lớn nhất đã được sử dụng
    let maxNumber = 0;
    existingBaseUsernames.forEach(username => {
        const numberPart = username.substring(base.length);
        const number = parseInt(numberPart, 10);
        if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
        }
    });
    
    // Kiểm tra xem base username (không có số) đã tồn tại chưa
    if (existingUsernames.includes(base)) {
        maxNumber = Math.max(maxNumber, 0);
    }
    
    // Trả về username với số tiếp theo
    return base + (maxNumber + 1);
}

// Test function
export function testUsernameGeneration() {
    const testCases = [
        {
            name: 'Nguyễn Thị Ngọc',
            existing: ['NguyenNT1', 'NguyenNT2', 'NguyenNT5', 'TranVN1', 'NguyenNT'],
            expected: 'NguyenNT6'
        },
        {
            name: 'Nguyễn Thị Nam',
            existing: ['NguyenNT1', 'NguyenNT2', 'NguyenNT5', 'TranVN1', 'NguyenNT'],
            expected: 'NguyenNT6'
        },
        {
            name: 'Trần Văn Ngọc',
            existing: ['NguyenNT1', 'NguyenNT2', 'NguyenNT5', 'TranVN1', 'NguyenNT'],
            expected: 'NgocTV2'
        },
        {
            name: 'Lê Văn An',
            existing: ['NguyenNT1', 'NguyenNT2', 'NguyenNT5', 'TranVN1', 'NguyenNT'],
            expected: 'AnLV1'
        },
        {
            name: 'Phạm Thị Bình',
            existing: ['NguyenNT1', 'NguyenNT2', 'NguyenNT5', 'TranVN1', 'NguyenNT', 'BinhPT1'],
            expected: 'BinhPT2'
        }
    ];

    console.log('=== Testing Username Generation ===');
    testCases.forEach((testCase, index) => {
        const result = generateUsername(testCase.name, testCase.existing);
        const passed = result === testCase.expected;
        console.log(`Test ${index + 1}: ${testCase.name}`);
        console.log(`  Expected: ${testCase.expected}, Got: ${result}, ${passed ? 'PASS' : 'FAIL'}`);
    });
} 