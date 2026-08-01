lines = open('.env', 'r').readlines()
updated = []

for line in lines:
    if line.startswith('CORS_ORIGINS='):
        updated.append('CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000\n')
    else:
        updated.append(line)

open('.env', 'w').writelines(updated)
print('Updated CORS_ORIGINS to include port 5174')
