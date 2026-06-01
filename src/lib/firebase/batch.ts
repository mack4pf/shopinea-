import { doc, writeBatch, type CollectionReference, type DocumentData, type Firestore, type QueryDocumentSnapshot } from "firebase/firestore";

const FIRESTORE_BATCH_LIMIT = 450;

export async function commitInChunks<T extends DocumentData>(
    db: Firestore,
    collectionRef: CollectionReference,
    items: T[],
    getId?: (item: T) => string | undefined
) {
    for (let index = 0; index < items.length; index += FIRESTORE_BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = items.slice(index, index + FIRESTORE_BATCH_LIMIT);

        chunk.forEach((item) => {
            const id = getId?.(item);
            batch.set(id ? doc(collectionRef, id) : doc(collectionRef), item);
        });

        await batch.commit();
    }
}

export async function updateInChunks<T extends DocumentData & { id?: string }>(
    db: Firestore,
    collectionRef: CollectionReference,
    items: T[]
) {
    for (let index = 0; index < items.length; index += FIRESTORE_BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = items.slice(index, index + FIRESTORE_BATCH_LIMIT);

        chunk.forEach((item) => {
            if (item.id) {
                const { id, ...data } = item;
                batch.update(doc(collectionRef, id), data);
            } else {
                batch.set(doc(collectionRef), item);
            }
        });

        await batch.commit();
    }
}

export async function deleteDocsInChunks(db: Firestore, docs: QueryDocumentSnapshot[]) {
    for (let index = 0; index < docs.length; index += FIRESTORE_BATCH_LIMIT) {
        const batch = writeBatch(db);
        docs.slice(index, index + FIRESTORE_BATCH_LIMIT).forEach((snapshot) => batch.delete(snapshot.ref));
        await batch.commit();
    }
}
