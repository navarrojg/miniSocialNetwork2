import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";

import { Post } from "./post.model";
import { map } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";

@Injectable({ providedIn: "root" })
export class PostsService {
	private posts: Post[] = [];
	private postsUpdated = new Subject<Post[]>();

	constructor(
		private http: HttpClient,
		private router: Router,
		private route: ActivatedRoute
	) {}

	getPosts(postsPerPage: number, currentPage: number) {
		const queryParams = `?pageSize=${postsPerPage}&page=${currentPage}`;
		this.http
			.get<{ message: string; posts: any }>(
				"http://localhost:3000/api/posts" + queryParams
			)
			.pipe(
				map((postData) => {
					return postData.posts.map((post) => {
						return {
							title: post.title,
							content: post.content,
							id: post._id,
							imagePath: post.imagePath,
						};
					});
				})
			)
			.subscribe((transformedPosts) => {
				this.posts = transformedPosts;
				this.postsUpdated.next([...this.posts]);
			});
	}

	getPostUpdateListener() {
		return this.postsUpdated.asObservable();
	}

	getPost(id: string) {
		// return { ...this.posts.find((p) => p.id === id) };
		return this.http.get<{
			_id: string;
			title: string;
			content: string;
			imagePath: string;
		}>("http://localhost:3000/api/posts/" + id);
	}

	addPost(title: string, content: string, image: File) {
		// const post: Post = { id: null, title: title, content: content };
		const postData = new FormData();
		postData.append("title", title);
		postData.append("content", content);
		postData.append("image", image, title);

		this.http
			.post<{ message: string; post: Post }>(
				"http://localhost:3000/api/posts",
				postData
			)
			.subscribe((responseData) => {
				const post: Post = {
					id: responseData.post.id,
					title: title,
					content: content,
					imagePath: responseData.post.imagePath,
				};

				this.posts.push(post);
				this.postsUpdated.next([...this.posts]);
				this.router.navigate(["../"], { relativeTo: this.route });
			});
	}

	updatePost(id: string, title: string, content: string, image: File | string) {
		let postData: Post | FormData;
		if (typeof image === "object") {
			postData = new FormData();
			postData.append("id", id);
			postData.append("title", title);
			postData.append("content", content);
			postData.append("image", image, title);
		} else {
			postData = {
				id: id,
				title: title,
				content: content,
				imagePath: image,
			};
		}
		this.http
			.put("http://localhost:3000/api/posts/" + id, postData)
			.subscribe((response) => {
				const updatedPosts = [...this.posts];
				const oldPostIndex = updatedPosts.findIndex((p) => p.id === id);
				const post: Post = {
					id: id,
					title: title,
					content: content,
					imagePath: "",
				};
				updatedPosts[oldPostIndex] = post;
				this.posts = updatedPosts;
				this.postsUpdated.next([...this.posts]);
				this.router.navigate(["/"]);
			});
	}

	deletePost(postId: string) {
		this.http
			.delete("http://localhost:3000/api/posts/" + postId)
			.subscribe(() => {
				console.log("Deleted!");
				const updatedPosts = this.posts.filter((post) => post.id !== postId);
				this.posts = updatedPosts;
				this.postsUpdated.next([...this.posts]);
			});
	}
}
