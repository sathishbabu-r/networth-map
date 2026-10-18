import Google from "@auth/core/providers/google";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";
import { enrollEvaluator, evaluatorRecord } from "./evaluator";
import type {MutationCtx} from "./_generated/server";
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, Anonymous({id:"evaluator",profile:()=>({isAnonymous:true})})],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, {userId,provider}) {
      if(provider.id !== "evaluator" && (await ctx.db.get(userId))?.isAnonymous) throw Error("End the evaluator session before Google Login.");
      if(provider.id === "evaluator") await enrollEvaluator(ctx as MutationCtx,userId);
    },
    async beforeSessionCreation(ctx,{userId}) {
      const state=await evaluatorRecord(ctx as MutationCtx,userId);
      if(state.kind==='expired'||state.kind==='missing')throw Error("Evaluator session unavailable. Use Google Login.");
    },
  },
});
