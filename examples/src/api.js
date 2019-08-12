export async function getProfile() {
  return { uid: 10086, name: 'ResouceX' };
}

export async function setName(name) {
  return { success: true };
}
