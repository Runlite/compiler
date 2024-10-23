const subscriberContent = `
import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from "typeorm";
import { Post } from "../entity/Post";

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    /**
     * Called after entity is loaded.
     */
    afterLoad(entity: Post) {
        console.log(\`Post loaded: \${entity.title}\`);
    }

    /**
     * Indicates that this subscriber only listen to Post events.
     */
    listenTo() {
        return Post;
    }

    /**
     * Called before post insertion.
     */
    beforeInsert(event: InsertEvent<Post>) {
        console.log("BEFORE POST INSERTED: ", event.entity);
    }
}
`;
const migrationContent = `
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`CREATE TABLE post (id SERIAL PRIMARY KEY, title VARCHAR(255), content TEXT);\`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`DROP TABLE post;\`);
    }
}
`;
const entityContent = `
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    content: string;
}
`;
module.exports = { migrationContent, entityContent, subscriberContent };
