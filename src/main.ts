import {bootstrapApplication} from '@angular/platform-browser';
import {provideHttpClient} from '@angular/common/http';
import {provideRouter, Routes} from '@angular/router';
import {AppComponent} from './app/app.component';

const routes: Routes=[
 {path:'',component:AppComponent},
 {path:'login',component:AppComponent},
 {path:'**',redirectTo:''}
];
bootstrapApplication(AppComponent,{providers:[provideHttpClient(),provideRouter(routes)]}).catch(console.error);
