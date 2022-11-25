import App from "@/app";
import IndexRoute from "@routes/index.route";
import AuthRoute from "@routes/auth/auth.route";
import UserRoute from "@routes/users/user.route";
import JobRoute from "@/routes/Job/job.route";
import AdminRoute from "@/routes/admin/admin.route";

const routes = [new IndexRoute(), new AuthRoute(), new UserRoute(), new JobRoute(), new AdminRoute()];

const app = new App(routes);
app.connectToDatabase();
app.listen();
